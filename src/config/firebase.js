import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Substitua estas configurações pelas suas chaves do Firebase
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
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