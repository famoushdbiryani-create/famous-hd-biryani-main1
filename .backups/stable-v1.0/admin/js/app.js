// admin/js/app.js
// Firebase Firestore & Storage Management Logic

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Same config as auth.js
const firebaseConfig = {
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- MENU MANAGEMENT ---

const menuForm = document.getElementById('menu-item-form');
if (menuForm) {
    menuForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('menu-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = "UPLOADING...";

        const name = document.getElementById('menu-name').value;
        const price = document.getElementById('menu-price').value;
        const category = document.getElementById('menu-category').value;
        const dietary = document.getElementById('menu-dietary').value;
        const description = document.getElementById('menu-description').value;
        const imageFile = document.getElementById('menu-image').files[0];

        let imageUrl = "";

        try {
            // 1. Upload Image if exists
            if (imageFile) {
                const storageRef = ref(storage, `menu/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            // 2. Add to Firestore
            await addDoc(collection(db, "menu_items"), {
                name,
                price,
                category,
                dietary,
                description,
                imageUrl,
                createdAt: Date.now()
            });

            alert("Item added successfully!");
            menuForm.reset();
            document.getElementById('modal-menu').classList.add('hidden');
        } catch (error) {
            console.error("Error adding item:", error);
            alert("Failed to add item: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "SAVE ITEM";
        }
    });
}

// Live Listener for Menu Items
const menuGrid = document.getElementById('menu-items-grid');
if (menuGrid) {
    onSnapshot(query(collection(db, "menu_items"), orderBy("createdAt", "desc")), (snapshot) => {
        menuGrid.innerHTML = "";
        document.getElementById('stat-menu-count').innerText = snapshot.size;
        
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id;
            
            const card = document.createElement('div');
            card.className = "bg-[#121212] rounded-2xl border border-gray-800 overflow-hidden shadow-lg group relative";
            card.innerHTML = `
                <div class="h-40 bg-gray-900 relative overflow-hidden">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}" class="w-full h-full object-cover transition-transform group-hover:scale-110">
                    <div class="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-primary uppercase">${item.category}</div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-white">${item.name}</h4>
                        <span class="text-primary font-bold">$${item.price}</span>
                    </div>
                    <p class="text-gray-500 text-xs line-clamp-2">${item.description}</p>
                    <div class="mt-4 flex gap-2">
                        <button onclick="deleteItem('${id}')" class="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-xs font-bold transition">DELETE</button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });
    });
}

// Global Delete Function
window.deleteItem = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await deleteDoc(doc(db, "menu_items", id));
        } catch (error) {
            alert("Error deleting item: " + error.message);
        }
    }
};

// --- GALLERY MANAGEMENT ---
// Similar logic for gallery will go here...
