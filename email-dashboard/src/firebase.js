// Firebase configuration for VodafoneThree Dashboard
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoMC84IgdPN-bSfe_FMgy29x7s42T25PM",
  authDomain: "vodafonethree-dashboard.firebaseapp.com",
  projectId: "vodafonethree-dashboard",
  storageBucket: "vodafonethree-dashboard.firebasestorage.app",
  messagingSenderId: "1062168254517",
  appId: "1:1062168254517:web:fcc7e04c15e9199a96397c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
