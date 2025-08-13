'use client';

import { savePushSubscription } from './actions';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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

    // Convert the subscription to a plain JSON object before sending
    await savePushSubscription(subscription.toJSON());
    console.log('Push subscription saved successfully.');
  } catch (error) {
    console.error('Failed to register service worker or subscribe to push notifications:', error);
  }
}

    