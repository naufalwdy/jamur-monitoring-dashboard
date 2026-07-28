import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBf2Mnai6Iw50ENkJuNPX47yPZ3FVFfMYI",
  authDomain: "monitoring-jamur-51ece.firebaseapp.com",
  databaseURL: "https://monitoring-jamur-51ece-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monitoring-jamur-51ece",
  storageBucket: "monitoring-jamur-51ece.firebasestorage.app",
  messagingSenderId: "768801287106",
  appId: "1:768801287106:web:e5f9a2ba1cf7d6e1d9045b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Realtime Database instance
export const db = getDatabase(app);
