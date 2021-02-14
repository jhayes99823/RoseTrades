importScripts('/__/firebase/7.18.0/firebase-app.js');
importScripts('/__/firebase/8.2.7/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});