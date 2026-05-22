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
    apiKey: "AIzaSyBVVxUJgA7sZF_v4Qv5IdsuRD2XIplw6X8",
    authDomain: "famous-hd-biryani-new.firebaseapp.com",
    projectId: "famous-hd-biryani-new",
    storageBucket: "famous-hd-biryani-new.firebasestorage.app",
    messagingSenderId: "192509334649",
    appId: "1:192509334649:web:7d7c50ada7bdbb1a6430a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
