// firebase-data-sync.js
// This script pulls data from Firebase and updates the website content dynamically

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Same config as admin/js/auth.js
const firebaseConfig = {
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to render menu items
export const syncMenu = () => {
    onSnapshot(query(collection(db, "menu_items"), orderBy("createdAt", "asc")), (snapshot) => {
        // Clear or prepare containers
        const categories = {}; // Map of category name -> array of items

        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            if (!categories[item.category]) categories[item.category] = [];
            categories[item.category].push(item);
        });

        // Update the UI
        Object.keys(categories).forEach(catName => {
            const containerId = `dynamic-${catName.toLowerCase().replace(/\s+/g, '-')}-list`;
            const container = document.getElementById(containerId);
            
            if (container) {
                container.innerHTML = ""; // Clear existing
                categories[catName].forEach(item => {
                    const itemHtml = `
                        <div class="menu-item p-6 bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl ${item.dietary}">
                            <div class="flex flex-col md:flex-row gap-6">
                                ${item.imageUrl ? `
                                <div class="w-full md:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                                    <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-full object-cover" loading="lazy">
                                </div>
                                ` : ''}
                                <div class="flex-grow">
                                    <div class="flex justify-between items-start mb-2">
                                        <h4 class="font-display text-xl font-bold text-gray-900 dark:text-white">${item.name}</h4>
                                        <span class="text-primary font-bold text-lg">$${item.price}</span>
                                    </div>
                                    <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">${item.description}</p>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 ${item.dietary === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-[10px] font-bold uppercase rounded">${item.dietary}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        });
    });
};

// Auto-run if on menu page
if (window.location.pathname.includes('menu.html')) {
    syncMenu();
}
