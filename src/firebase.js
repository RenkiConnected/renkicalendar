import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUvdAqkNbcaZijRMcuGqonUmDc86eNB4g",
  authDomain: "care-planning-be765.firebaseapp.com",
  projectId: "care-planning-be765",
  storageBucket: "care-planning-be765.firebasestorage.app",
  messagingSenderId: "907265004229",
  appId: "1:907265004229:web:1476d531637f0bf90d96ac"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
