import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAq5jpz7ghfnzasaOiQjtCfD5D3eh0HljI",
  authDomain: "baseball-lineup-app-5e07e.firebaseapp.com",
  projectId: "baseball-lineup-app-5e07e",
  storageBucket: "baseball-lineup-app-5e07e.firebasestorage.app",
  messagingSenderId: "215984369132",
  appId: "1:215984369132:web:fd2d886057c2d27d4a64c9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
