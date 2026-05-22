// admin/js/auth.js
// Firebase Authentication Logic

import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Handle Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-msg');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnContent = submitBtn.innerHTML;

        // Visual feedback
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>SIGNING IN...</span>';
        errorMsg.classList.add('hidden');

        try {
            // Set session persistence to remain logged in
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMsg.classList.remove('hidden');
            let userFriendlyMsg = "Invalid email or password. Please try again.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                userFriendlyMsg = "Incorrect email or password. Access denied.";
            } else if (error.code === 'auth/invalid-credential') {
                userFriendlyMsg = "Invalid credentials. Please verify and try again.";
            } else if (error.code === 'auth/network-request-failed') {
                userFriendlyMsg = "Network error. Please check your internet connection.";
            }
            errorMsg.innerText = userFriendlyMsg;
            console.error("Login failed:", error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
        }
    });
}

// Global Logout
window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout failed:", error.message);
    }
};

// Check Auth State for Dashboard
if (window.location.pathname.includes('dashboard.html')) {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl) {
                userEmailEl.innerText = user.email;
            }
        }
    });
}

