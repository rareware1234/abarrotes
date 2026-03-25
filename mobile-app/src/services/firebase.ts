import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbCx0vsgamfVTOr7nLd5BHddCyeDtJWqg",
  authDomain: "abarrotes-digitales.firebaseapp.com",
  projectId: "abarrotes-digitales",
  storageBucket: "abarrotes-digitales.firebasestorage.app",
  messagingSenderId: "953573955131",
  appId: "1:953573955131:web:7a1e29db7e379542636e1e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
