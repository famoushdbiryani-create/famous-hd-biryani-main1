// admin/js/firebase-config.js
// ============================================================
// SHARED FIREBASE CONFIGURATION — Single Source of Truth
// Replace the placeholder values below with your Firebase project config.
// Find these at: Firebase Console → Project Settings → General → Your Apps
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4hyezwxIoRaxoeJbR1CGXujFSFn9qaYM",
    authDomain: "famous-hd-biryani.firebaseapp.com",
    projectId: "famous-hd-biryani",
    storageBucket: "famous-hd-biryani.firebasestorage.app",
    messagingSenderId: "321047092003",
    appId: "1:321047092003:web:62653cf6823a615fe94a96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
