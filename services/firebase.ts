import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage';

// Config provided by CVNEWS MEDIA CC
export const firebaseConfig = {
  apiKey: "AIzaSyDXpLHtn6IoE08Rj_ImXT_0Dem68rCZ2A0",
  authDomain: "cvnews-media-cc.firebaseapp.com",
  projectId: "cvnews-media-cc",
  storageBucket: "cvnews-media-cc.firebasestorage.app",
  messagingSenderId: "162506012822",
  appId: "1:162506012822:web:4994df39bf03fab8c36ab7",
  measurementId: "G-FJ2N8W597F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);