import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Firebase configuration - replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyB9dCHjEG9hs66EhrajUIYQjfz9od5QMI0",
  authDomain: "mediclinic-web.firebaseapp.com",
  projectId: "mediclinic-web",
  storageBucket: "mediclinic-web.firebasestorage.app",
  messagingSenderId: "1065611441288",
  appId: "1:1065611441288:web:ce98e82a4e8167ad599b3d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

// VAPID key for web push notifications - replace with your actual VAPID key
export const vapidKey = "BAlb4z7dak2-_KHVAVIAHYVBn3wQmOCIwcNiuhhvyoz3Hsyj-6FWzmFNWMgKh9BwWG5gZLwBJBXSNS18LX06biA";

export { getToken, onMessage };
export default app;
