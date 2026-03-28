import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyD28C5mJkvV8tpmt75zUsGUU1B1WPN_pgk",
  authDomain:        "collatzsurvivor-8d189.firebaseapp.com",
  projectId:         "collatzsurvivor-8d189",
  storageBucket:     "collatzsurvivor-8d189.firebasestorage.app",
  messagingSenderId: "341383369964",
  appId:             "1:341383369964:web:4d0a2679770c6da447c1c9",
  measurementId:     "G-7C2X79BY4M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
