import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD1J4WBUHJkKwiV1UrsyIV-58fc7RzYVhk",
  authDomain: "sistema-gestao-gasolina.firebaseapp.com",
  projectId: "sistema-gestao-gasolina",
  storageBucket: "sistema-gestao-gasolina.firebasestorage.app",
  messagingSenderId: "843683965473",
  appId: "1:843683965473:web:8d10b632038db21385d160",
  measurementId: "G-CN9NHLZG15"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;