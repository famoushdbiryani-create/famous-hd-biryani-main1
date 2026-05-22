// admin/js/auth.js
// Firebase Authentication Logic

import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Check for inactivity timeout URL parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('timeout') === 'true') {
    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) {
        errorMsg.classList.remove('hidden', 'bg-red-500/10', 'border-red-500/50', 'text-red-500');
        errorMsg.classList.add('bg-amber-500/10', 'border-amber-500/50', 'text-amber-400');
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle mr-2 text-amber-500"></i><span>You have been logged out due to 5 minutes of inactivity.</span>';
    }
}

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
            // Display the exact Firebase error message for debugging purposes
            errorMsg.innerText = "Error: " + error.code + " - " + error.message;
            console.error("Login failed:", error);
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
if (window.location.pathname.includes('dashboard')) {
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

