'use strict';

self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = data.title || 'Recaudo Seguro';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    ...data.options,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      // Si la ventana de la app ya está abierta, la enfoca.
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abre una nueva ventana.
      if (clients.openWindow) {
        return clients.openWindow('/dashboard/cobrador/ruta');
      }
    })
  );
});
