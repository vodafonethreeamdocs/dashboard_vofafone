// Firebase configuration for VodafoneThree Dashboard
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoMC84IgdPN-bSfe_FMgy29x7s42T25PM",
  authDomain: "vodafonethree-dashboard.firebaseapp.com",
  projectId: "vodafonethree-dashboard",
  storageBucket: "vodafonethree-dashboard.firebasestorage.app",
  messagingSenderId: "1062168254517",
  appId: "1:1062168254517:web:fcc7e04c15e9199a96397c",
  databaseURL: "https://vodafonethree-dashboard-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Realtime Database for audit logging
export const db = getDatabase(app);

export default app;
