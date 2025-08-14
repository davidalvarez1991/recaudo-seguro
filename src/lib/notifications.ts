'use client';

import { savePushSubscription } from './actions';
import webpush from 'web-push';
import { getUserData } from './actions';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

if (typeof window === 'undefined') {
  // Server-side configuration
  if (!process.env.VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    console.warn('VAPID keys are not configured. Push notifications will be disabled.');
  } else {
    webpush.setVapidDetails(
      'mailto:recaudo.seguro.servicio.cliente@gmail.com',
      VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerAndSubscribe() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications are not supported by this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);

    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission for notifications was denied.');
      return;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (subscription === null) {
      if (!VAPID_PUBLIC_KEY) {
        console.error('VAPID public key is not defined.');
        return;
      }
      console.log('No subscription found, creating new one...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await savePushSubscription(subscription.toJSON());
    console.log('Push subscription saved successfully.');
  } catch (error) {
    console.error('Failed to register service worker or subscribe to push notifications:', error);
  }
}

export async function sendNotificationToProvider(providerId: string, payload: { title: string; body: string; }) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.log('VAPID keys not set on server. Skipping push notification.');
    return;
  }
  try {
    const provider = await getUserData(providerId);
    if (provider && provider.pushSubscription) {
      const subscription = provider.pushSubscription;
      const notificationPayload = JSON.stringify(payload);
      
      await webpush.sendNotification(subscription, notificationPayload);
      console.log(`Push notification sent to provider ${providerId}`);
    }
  } catch (error) {
    console.error(`Failed to send push notification to provider ${providerId}:`, error);
  }
}
