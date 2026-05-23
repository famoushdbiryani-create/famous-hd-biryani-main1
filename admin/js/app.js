// admin/js/app.js
// Central Administration Controller for Famous HD Biryani

import { db, storage, auth } from './firebase-config.js';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, setDoc, query, orderBy, onSnapshot, where, serverTimestamp, limit, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { 
    ref, uploadBytes, getDownloadURL, deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';

// Global variables
let activeOffers = [];
let activeMenuItems = [];
let activeGalleryItems = [];
let selectedMenuCategory = 'ALL';
let selectedGalleryCategory = 'ALL';
let currentTestimonials = [];
let currentTeamMembers = [];

// ==========================================
// 🔐 AUTHENTICATION CONTROL & GUARD
// ==========================================
// Auto-logout after 5 minutes of inactivity
let inactivityTimeout;
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in milliseconds

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(handleAutoLogout, INACTIVITY_LIMIT);
}

async function handleAutoLogout() {
    try {
        console.log("Inactivity limit reached. Logging out...");
        await signOut(auth);
        window.location.href = 'index.html?timeout=true';
    } catch (err) {
        console.error("Auto-logout failed:", err);
        window.location.href = 'index.html?timeout=true';
    }
}

function setupInactivityTracker() {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not authenticated, redirect to login
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = 'index.html';
        }
    } else {
        // Authenticated
        const emailSidebar = document.getElementById('user-email-sidebar');
        if (emailSidebar) emailSidebar.innerText = user.email;

        // Check if config has placeholders
        const isPlaceholder = auth.app.options.apiKey === 'REPLACE_WITH_YOUR_API_KEY';
        const warningCard = document.getElementById('firebase-warning-card');
        if (isPlaceholder && warningCard) {
            warningCard.classList.remove('hidden');
        }

        // Setup activity tracking for auto-logout
        setupInactivityTracker();

        // Initialize listeners
        initializeAdmin();
    }
});

// Initialize listeners and load data
async function initializeAdmin() {
    if (auth.app.options.apiKey === 'REPLACE_WITH_YOUR_API_KEY') {
        if (window.hideLoading) window.hideLoading();
        return;
    }

    try {
        // Set up Firestore Listeners
        setupOffersListener();
        setupMenuListener();
        setupGalleryListener();
        
        // Load Static Pages Content asynchronously and resiliently
        await Promise.allSettled([
            loadHomeContent(),
            loadAboutContent(),
            loadContactContent(),
            loadSettings()
        ]);
        
        // Check if database is empty to show Setup Assist card
        await checkDatabaseEmpty();
    } catch (error) {
        console.error("Error during admin panel initialization:", error);
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
}

// ==========================================
// 🔥 OFFERS & TIMED ANNOUNCEMENTS CRUD
// ==========================================
function setupOffersListener() {
    const offersRef = collection(db, 'offers');
    const q = query(offersRef, orderBy('createdAt', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        activeOffers = [];
        snapshot.forEach((doc) => {
            activeOffers.push({ id: doc.id, ...doc.data() });
        });
        
        renderOffersList();
        updateStatCounters();
    });
}

function renderOffersList() {
    const listEl = document.getElementById('active-offers-list');
    if (!listEl) return;
    
    if (activeOffers.length === 0) {
        listEl.innerHTML = `
            <div class="col-span-full p-8 bg-[#121212] border border-gray-900 rounded-3xl text-center text-gray-500 text-sm">
                <i class="fas fa-tags text-4xl text-gray-700 mb-3"></i>
                <p>No offers created yet. Click "Create New Offer" to start.</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = activeOffers.map(offer => {
        const statusInfo = getOfferStatus(offer);
        return `
            <div class="p-6 bg-[#121212] rounded-2xl border border-gray-900 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-primary/30">
                <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
                
                <div class="space-y-3">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">
                                <i class="fas fa-${getIconString(offer.icon)}"></i>
                            </span>
                            <div>
                                <h4 class="text-white font-bold text-sm tracking-wide font-display">${offer.title}</h4>
                                <span class="text-xs text-primary font-semibold">${offer.discount}</span>
                            </div>
                        </div>
                        
                        <!-- Status Badge -->
                        ${statusInfo.badgeHtml}
                    </div>
                    
                    <p class="text-gray-400 text-xs leading-relaxed line-clamp-2">${offer.description || 'No description provided.'}</p>
                    
                    <!-- Date Range -->
                    <div class="text-[10px] text-gray-500 bg-black/40 px-3 py-1.5 rounded-lg border border-gray-900 flex flex-col gap-0.5">
                        <div><span class="text-gray-400 font-semibold">Start:</span> ${formatDate(offer.startDate)}</div>
                        <div><span class="text-gray-400 font-semibold">End:</span> ${formatDate(offer.endDate)}</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between border-t border-gray-900 pt-4 mt-4 gap-3">
                    <label class="flex items-center gap-2 cursor-pointer shrink-0">
                        <input type="checkbox" ${offer.enabled ? 'checked' : ''} 
                            onchange="toggleOfferEnabled('${offer.id}', ${offer.enabled})" 
                            class="w-4 h-4 accent-primary bg-gray-900 border-gray-800 rounded">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active</span>
                    </label>
                    
                    <div class="flex gap-2">
                        <button onclick="editOffer('${offer.id}')" class="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg text-xs font-semibold transition" title="Edit Offer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteOffer('${offer.id}')" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg text-xs font-semibold transition border border-red-500/20" title="Delete Offer">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getOfferStatus(offer) {
    const now = Date.now();
    const start = new Date(offer.startDate).getTime();
    const end = new Date(offer.endDate).getTime();
    
    if (!offer.enabled) {
        return {
            state: 'disabled',
            badgeHtml: `<span class="bg-gray-800/80 text-gray-400 border border-gray-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Disabled</span>`
        };
    }
    
    if (now < start) {
        return {
            state: 'scheduled',
            badgeHtml: `<span class="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Scheduled</span>`
        };
    } else if (now > end) {
        return {
            state: 'expired',
            badgeHtml: `<span class="bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Expired</span>`
        };
    } else {
        return {
            state: 'active',
            badgeHtml: `<span class="bg-green-500/10 text-green-400 border border-green-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase badge-pulse">Active</span>`
        };
    }
}

window.openOfferModal = function() {
    document.getElementById('offer-form').reset();
    document.getElementById('offer-edit-id').value = '';
    document.getElementById('offer-modal-title').innerText = 'Create Special Promotion';
    
    // Set default dates
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    document.getElementById('offer-start-date').value = formatLocalDateTime(now);
    document.getElementById('offer-end-date').value = formatLocalDateTime(tomorrow);
    
    window.openModal('offer');
};

window.editOffer = async function(id) {
    if (window.showLoading) window.showLoading();
    try {
        const docRef = doc(db, 'offers', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('offer-edit-id').value = id;
            document.getElementById('offer-title').value = data.title || '';
            document.getElementById('offer-discount').value = data.discount || '';
            document.getElementById('offer-description').value = data.description || '';
            document.getElementById('offer-banner-text').value = data.bannerText || '';
            document.getElementById('offer-cta-text').value = data.ctaText || '';
            document.getElementById('offer-cta-link').value = data.ctaLink || '';
            
            document.getElementById('offer-enabled').checked = !!data.enabled;
            document.getElementById('offer-popup-enabled').checked = !!data.popupEnabled;
            document.getElementById('offer-banner-enabled').checked = !!data.bannerEnabled;
            
            document.getElementById('offer-start-date').value = data.startDate || '';
            document.getElementById('offer-end-date').value = data.endDate || '';
            document.getElementById('offer-icon').value = data.icon || 'sun';
            
            document.getElementById('offer-modal-title').innerText = 'Edit Promotion Details';
            window.openModal('offer');
        }
    } catch (err) {
        console.error("Error loading offer:", err);
        window.showToast("Could not load offer details.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

window.toggleOfferEnabled = async function(id, currentState) {
    try {
        const docRef = doc(db, 'offers', id);
        await updateDoc(docRef, { enabled: !currentState });
        window.showToast("Offer status toggled successfully.", "success");
    } catch (err) {
        console.error("Error toggling offer:", err);
        window.showToast("Failed to toggle offer status.", "error");
    }
};

window.deleteOffer = async function(id) {
    if (confirm("Are you absolutely sure you want to delete this promotion? This action cannot be undone.")) {
        if (window.showLoading) window.showLoading();
        try {
            await deleteDoc(doc(db, 'offers', id));
            window.showToast("Offer deleted successfully.", "success");
        } catch (err) {
            console.error("Error deleting offer:", err);
            window.showToast("Failed to delete the offer.", "error");
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    }
};

// Handle offer form submission
const offerForm = document.getElementById('offer-form');
if (offerForm) {
    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (window.showLoading) window.showLoading();
        
        const id = document.getElementById('offer-edit-id').value;
        const offerData = {
            title: document.getElementById('offer-title').value,
            discount: document.getElementById('offer-discount').value,
            description: document.getElementById('offer-description').value,
            bannerText: document.getElementById('offer-banner-text').value,
            ctaText: document.getElementById('offer-cta-text').value,
            ctaLink: document.getElementById('offer-cta-link').value,
            enabled: document.getElementById('offer-enabled').checked,
            popupEnabled: document.getElementById('offer-popup-enabled').checked,
            bannerEnabled: document.getElementById('offer-banner-enabled').checked,
            startDate: document.getElementById('offer-start-date').value,
            endDate: document.getElementById('offer-end-date').value,
            icon: document.getElementById('offer-icon').value,
            updatedAt: serverTimestamp()
        };
        
        try {
            if (id) {
                // Update
                const docRef = doc(db, 'offers', id);
                await updateDoc(docRef, offerData);
                window.showToast("Offer updated successfully!", "success");
            } else {
                // Create
                offerData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'offers'), offerData);
                window.showToast("Promotion created and scheduled!", "success");
            }
            window.closeModal('offer');
        } catch (err) {
            console.error("Error saving offer:", err);
            window.showToast("Could not save promotional offer.", "error");
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    });
}

// ==========================================
// 🍽️ MENU CATALOG MANAGEMENT CRUD
// ==========================================
function setupMenuListener() {
    const menuRef = collection(db, 'menu_items');
    const q = query(menuRef, orderBy('createdAt', 'desc'));
    
    onSnapshot(q, async (snapshot) => {
        activeMenuItems = [];
        let needsMigration = false;
        const migrationBatch = writeBatch(db);
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let cat = data.category || "";
            let updated = false;
            
            // Map legacy categories if present
            if (cat === "Vegetarian Curries") {
                cat = "Veg Curries";
                updated = true;
            } else if (cat === "Breads / Naan / Roti") {
                cat = "Breads";
                updated = true;
            } else if (cat === "Regular Biryanis") {
                cat = "Biryanis";
                updated = true;
            }
            
            if (updated) {
                migrationBatch.update(docSnap.ref, { category: cat });
                needsMigration = true;
            }
            
            activeMenuItems.push({ id: docSnap.id, ...data, category: cat });
        });
        
        if (needsMigration) {
            console.log("Auto-migrating legacy menu categories to standard codes...");
            try {
                await migrationBatch.commit();
                console.log("Migration complete!");
            } catch (err) {
                console.error("Migration batch commit failed:", err);
            }
        }
        
        renderMenuList();
        updateStatCounters();
    });
}

function renderMenuList() {
    const gridEl = document.getElementById('menu-items-grid');
    if (!gridEl) return;
    
    // Apply filters
    let filteredItems = activeMenuItems;
    
    if (selectedMenuCategory !== 'ALL') {
        filteredItems = filteredItems.filter(item => item.category === selectedMenuCategory);
    }
    
    const searchVal = document.getElementById('menu-search').value.toLowerCase().trim();
    if (searchVal !== '') {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchVal) || 
            (item.description && item.description.toLowerCase().includes(searchVal))
        );
    }
    
    if (filteredItems.length === 0) {
        gridEl.innerHTML = `
            <div class="col-span-full p-12 bg-[#121212] border border-gray-900 rounded-3xl text-center text-gray-500 text-sm">
                <i class="fas fa-utensils text-4xl text-gray-700 mb-3"></i>
                <p>No food dishes match your search/filter selection.</p>
            </div>
        `;
        return;
    }
    
    gridEl.innerHTML = filteredItems.map(item => `
        <div class="bg-[#121212] rounded-3xl border border-gray-900 shadow-xl overflow-hidden flex flex-col justify-between hover:border-primary/20 transition duration-300">
            <!-- Top visual cover -->
            <div class="relative h-44 bg-gray-950 flex items-center justify-center overflow-hidden">
                ${item.imageUrl ? 
                    `<img src="${item.imageUrl}" class="w-full h-full object-cover">` : 
                    `<i class="fas fa-bowl-food text-gray-800 text-5xl"></i>`
                }
                
                <!-- Visibility Badge -->
                <span class="absolute top-4 left-4 text-[9px] font-bold tracking-wider px-2 py-1 rounded-lg uppercase ${item.visible ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}">
                    ${item.visible ? 'Publicly Visible' : 'Hidden'}
                </span>
                
                <!-- Dietary Badge -->
                <span class="absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-lg uppercase ${item.dietary === 'veg' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}">
                    ${item.dietary === 'veg' ? '🌱 Veg' : '🍖 Non-Veg'}
                </span>
            </div>
            
            <div class="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-start justify-between gap-3 mb-2">
                        <h4 class="text-white font-bold text-sm tracking-wide font-display line-clamp-1">${item.name}</h4>
                        <span class="text-primary font-bold text-sm">$${item.price}</span>
                    </div>
                    
                    <p class="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4">${item.description || 'No description provided.'}</p>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="text-[9px] font-semibold bg-gray-950 text-gray-400 border border-gray-800 px-2 py-0.5 rounded">${item.category}</span>
                        ${item.badge ? `<span class="text-[9px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">${item.badge}</span>` : ''}
                    </div>
                </div>
                
                <div class="flex items-center justify-between border-t border-gray-900 pt-4 mt-2">
                    <label class="flex items-center gap-2 cursor-pointer shrink-0">
                        <input type="checkbox" ${item.visible ? 'checked' : ''} 
                            onchange="toggleMenuVisible('${item.id}', ${item.visible})" 
                            class="w-4 h-4 accent-primary bg-gray-900 border-gray-800 rounded">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Show On Site</span>
                    </label>
                    
                    <div class="flex gap-1.5">
                        <button onclick="editMenuItem('${item.id}')" class="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg text-xs font-semibold transition" title="Edit Item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteMenuItem('${item.id}', '${item.imageUrl || ''}')" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg text-xs font-semibold transition border border-red-500/20" title="Delete Item">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

window.filterMenuCategory = function(category) {
    selectedMenuCategory = category;
    renderMenuList();
};

window.filterMenuSearch = function() {
    renderMenuList();
};

window.publishMenuChanges = function() {
    const btn = document.querySelector('button[onclick="publishMenuChanges()"]');
    if (!btn) return;
    
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>PUBLISHING...</span>';
    btn.disabled = true;
    
    // Simulate a short delay to give the satisfying feeling of publishing
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check-circle mr-2 text-green-400"></i><span class="text-green-400">PUBLISHED LIVE</span>';
        window.showToast("Menu successfully published to the live website!", "success");
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 3000);
    }, 1200);
};

window.openMenuModal = function() {
    document.getElementById('menu-item-form').reset();
    document.getElementById('menu-edit-id').value = '';
    document.getElementById('menu-image-url').value = '';
    document.getElementById('menu-modal-title').innerText = 'Add Dynamic Culinary Item';
    document.getElementById('menu-image-preview').innerHTML = '<i class="fas fa-image text-gray-700 text-xl"></i>';
    window.openModal('menu');
};

window.editMenuItem = async function(id) {
    if (window.showLoading) window.showLoading();
    try {
        const docRef = doc(db, 'menu_items', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('menu-edit-id').value = id;
            document.getElementById('menu-name').value = data.name || '';
            document.getElementById('menu-price').value = data.price || '';
            document.getElementById('menu-category').value = data.category || 'Biryanis';
            document.getElementById('menu-dietary').value = data.dietary || 'non-veg';
            document.getElementById('menu-description').value = data.description || '';
            document.getElementById('menu-badge').value = data.badge || '';
            document.getElementById('menu-visible').checked = !!data.visible;
            document.getElementById('menu-image-url').value = data.imageUrl || '';
            
            const preview = document.getElementById('menu-image-preview');
            if (data.imageUrl) {
                preview.innerHTML = `<img src="${data.imageUrl}" class="w-full h-full object-cover">`;
            } else {
                preview.innerHTML = '<i class="fas fa-image text-gray-700 text-xl"></i>';
            }
            
            document.getElementById('menu-modal-title').innerText = 'Edit Dish Details';
            window.openModal('menu');
        }
    } catch (err) {
        console.error("Error loading menu item:", err);
        window.showToast("Could not load menu item details.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

window.toggleMenuVisible = async function(id, currentState) {
    try {
        const docRef = doc(db, 'menu_items', id);
        await updateDoc(docRef, { visible: !currentState });
        window.showToast("Dish visibility toggled successfully.", "success");
    } catch (err) {
        console.error("Error toggling menu item:", err);
        window.showToast("Failed to toggle dish visibility.", "error");
    }
};

window.deleteMenuItem = async function(id, imageUrl) {
    if (confirm("Are you absolutely sure you want to remove this dish item? This action is permanent.")) {
        if (window.showLoading) window.showLoading();
        try {
            // Delete Firestore Document
            await deleteDoc(doc(db, 'menu_items', id));
            
            // Delete Image in Storage if exists
            if (imageUrl && imageUrl.includes('firebasestorage')) {
                try {
                    const storageRef = ref(storage, imageUrl);
                    await deleteObject(storageRef);
                } catch (stErr) {
                    console.warn("Storage deletion warning (image may have already been deleted):", stErr);
                }
            }
            
            window.showToast("Dish removed from menu Catalog.", "success");
        } catch (err) {
            console.error("Error removing menu item:", err);
            window.showToast("Failed to remove menu item.", "error");
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    }
};

// Form submission for menu items
const menuItemForm = document.getElementById('menu-item-form');
if (menuItemForm) {
    menuItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (window.showLoading) window.showLoading();
        
        const id = document.getElementById('menu-edit-id').value;
        const name = document.getElementById('menu-name').value;
        const price = document.getElementById('menu-price').value;
        const category = document.getElementById('menu-category').value;
        const dietary = document.getElementById('menu-dietary').value;
        const description = document.getElementById('menu-description').value;
        const badge = document.getElementById('menu-badge').value;
        const visible = document.getElementById('menu-visible').checked;
        const imageFile = document.getElementById('menu-image').files[0];
        
        try {
            let imageUrl = '';
            
            // Handle image uploads
            if (imageFile) {
                try {
                    const storagePath = `menu_images/${Date.now()}_${imageFile.name}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytes(storageRef, imageFile);
                    imageUrl = await getDownloadURL(storageRef);
                } catch (uploadErr) {
                    console.error("Storage upload failed:", uploadErr);
                    const urlVal = document.getElementById('menu-image-url').value.trim();
                    if (urlVal) {
                        imageUrl = urlVal;
                        window.showToast("Direct upload failed (Storage disabled). Used pasted Image URL instead.", "info");
                    } else {
                        throw new Error("Direct file upload requires Firebase Billing. Please paste an image URL instead.");
                    }
                }
            } else {
                const urlVal = document.getElementById('menu-image-url').value.trim();
                if (urlVal) {
                    imageUrl = urlVal;
                } else if (id) {
                    // Keep existing image if not uploading new
                    const existingSnap = await getDoc(doc(db, 'menu_items', id));
                    if (existingSnap.exists()) {
                        imageUrl = existingSnap.data().imageUrl || '';
                    }
                }
            }
            
            const dishData = {
                name,
                price,
                category,
                dietary,
                description,
                badge,
                visible,
                updatedAt: serverTimestamp()
            };
            
            if (imageUrl) dishData.imageUrl = imageUrl;
            
            if (id) {
                const docRef = doc(db, 'menu_items', id);
                await updateDoc(docRef, dishData);
                window.showToast("Dish details updated!", "success");
            } else {
                dishData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'menu_items'), dishData);
                window.showToast("New dish added to dynamic menu!", "success");
            }
            
            window.closeModal('menu');
        } catch (err) {
            console.error("Error saving dish:", err);
            window.showToast("Could not save culinary item details.", "error");
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    });
}

// ==========================================
// 🏠 HOME PAGE EDITOR (Draft Save & Preview)
// ==========================================
async function loadHomeContent() {
    try {
        // Hero Content
        const heroDoc = await getDoc(doc(db, 'site_content', 'home_hero'));
        if (heroDoc.exists()) {
            const data = heroDoc.data();
            document.getElementById('home-hero-subtitle').value = data.subtitle || '';
            document.getElementById('home-hero-title').value = data.title || '';
            document.getElementById('home-hero-description').value = data.description || '';
        }
        
        // Story Content
        const storyDoc = await getDoc(doc(db, 'site_content', 'home_story'));
        if (storyDoc.exists()) {
            const data = storyDoc.data();
            document.getElementById('home-story-title').value = data.title || '';
            document.getElementById('home-story-p1').value = data.paragraph1 || '';
            document.getElementById('home-story-p2').value = data.paragraph2 || '';
        }
        
        // Testimonials Content
        const testDoc = await getDoc(doc(db, 'site_content', 'home_testimonials'));
        if (testDoc.exists()) {
            currentTestimonials = testDoc.data().testimonials || [];
            renderTestimonialsList();
        }
    } catch (err) {
        console.error("Error loading homepage elements:", err);
    }
}

// Save draft to preview_content
window.saveHomeContentDraft = async function() {
    const heroRef = doc(db, 'preview_content', 'home_hero');
    const storyRef = doc(db, 'preview_content', 'home_story');
    const testimonialsRef = doc(db, 'preview_content', 'home_testimonials');
    
    await setDoc(heroRef, {
        subtitle: document.getElementById('home-hero-subtitle').value,
        title: document.getElementById('home-hero-title').value,
        description: document.getElementById('home-hero-description').value
    });
    
    await setDoc(storyRef, {
        title: document.getElementById('home-story-title').value,
        paragraph1: document.getElementById('home-story-p1').value,
        paragraph2: document.getElementById('home-story-p2').value
    });
    
    await setDoc(testimonialsRef, {
        testimonials: currentTestimonials
    });
};

// Publish draft to live content
window.saveHomeContent = async function() {
    if (window.showLoading) window.showLoading();
    try {
        const heroRef = doc(db, 'site_content', 'home_hero');
        const storyRef = doc(db, 'site_content', 'home_story');
        const testimonialsRef = doc(db, 'site_content', 'home_testimonials');
        
        const heroData = {
            subtitle: document.getElementById('home-hero-subtitle').value,
            title: document.getElementById('home-hero-title').value,
            description: document.getElementById('home-hero-description').value
        };
        
        const storyData = {
            title: document.getElementById('home-story-title').value,
            paragraph1: document.getElementById('home-story-p1').value,
            paragraph2: document.getElementById('home-story-p2').value
        };
        
        await setDoc(heroRef, heroData);
        await setDoc(storyRef, storyData);
        await setDoc(testimonialsRef, { testimonials: currentTestimonials });
        
        // Keep preview in sync
        await window.saveHomeContentDraft();
        
        window.showToast("Homepage published live instantly!", "success");
    } catch (err) {
        console.error("Error publishing home content:", err);
        window.showToast("Failed to publish homepage content.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

// Testimonials management
function renderTestimonialsList() {
    const listEl = document.getElementById('testimonials-list');
    if (!listEl) return;
    
    if (currentTestimonials.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-gray-500 italic text-center py-4">No reviews added yet. Click "Add Testimonial" above.</p>';
        return;
    }
    
    listEl.innerHTML = currentTestimonials.map((test, index) => `
        <div class="p-5 bg-gray-950/60 border border-gray-900 rounded-2xl flex flex-col md:flex-row gap-4 items-start relative">
            <button onclick="removeTestimonial(${index})" class="absolute top-4 right-4 text-red-400 hover:text-red-300 text-xs transition">
                <i class="fas fa-trash-alt mr-1"></i> Remove
            </button>
            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
                ${test.initials || test.name.slice(0, 2)}
            </div>
            
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4 md:pt-0">
                <div>
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Client Name</label>
                    <input type="text" value="${test.name}" oninput="updateTestimonialValue(${index}, 'name', this.value)" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">
                </div>
                <div>
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Customer Initials</label>
                    <input type="text" value="${test.initials || ''}" placeholder="e.g. JD" oninput="updateTestimonialValue(${index}, 'initials', this.value)" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">
                </div>
                <div>
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Star Rating (1-5)</label>
                    <input type="number" min="1" max="5" value="${test.rating || 5}" oninput="updateTestimonialValue(${index}, 'rating', parseInt(this.value))" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">
                </div>
                <div class="col-span-full">
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Review Paragraph Text</label>
                    <textarea rows="2" oninput="updateTestimonialValue(${index}, 'text', this.value)" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">${test.text}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

window.addTestimonial = function() {
    currentTestimonials.push({
        name: 'New Client',
        initials: 'NC',
        rating: 5,
        text: 'Truly exceptional biryani, cooked perfectly to absolute tradition.'
    });
    renderTestimonialsList();
};

window.removeTestimonial = function(index) {
    currentTestimonials.splice(index, 1);
    renderTestimonialsList();
};

window.updateTestimonialValue = function(index, key, value) {
    if (currentTestimonials[index]) {
        currentTestimonials[index][key] = value;
    }
};

// ==========================================
// 📖 ABOUT PAGE EDITOR
// ==========================================
async function loadAboutContent() {
    try {
        const heroDoc = await getDoc(doc(db, 'site_content', 'about_hero'));
        if (heroDoc.exists()) {
            const data = heroDoc.data();
            document.getElementById('about-hero-title').value = data.title || '';
            document.getElementById('about-hero-subtitle').value = data.subtitle || '';
        }
        
        const missionDoc = await getDoc(doc(db, 'site_content', 'about_mission'));
        if (missionDoc.exists()) {
            document.getElementById('about-mission-content').value = missionDoc.data().content || '';
        }
        
        const teamDoc = await getDoc(doc(db, 'site_content', 'about_team'));
        if (teamDoc.exists()) {
            currentTeamMembers = teamDoc.data().members || [];
            renderTeamMembersList();
        }
    } catch (err) {
        console.error("Error loading about page content:", err);
    }
}

window.saveAboutContentDraft = async function() {
    const heroRef = doc(db, 'preview_content', 'about_hero');
    const missionRef = doc(db, 'preview_content', 'about_mission');
    const teamRef = doc(db, 'preview_content', 'about_team');
    
    await setDoc(heroRef, {
        title: document.getElementById('about-hero-title').value,
        subtitle: document.getElementById('about-hero-subtitle').value
    });
    
    await setDoc(missionRef, {
        content: document.getElementById('about-mission-content').value
    });
    
    await setDoc(teamRef, {
        members: currentTeamMembers
    });
};

window.saveAboutContent = async function() {
    if (window.showLoading) window.showLoading();
    try {
        const heroRef = doc(db, 'site_content', 'about_hero');
        const missionRef = doc(db, 'site_content', 'about_mission');
        const teamRef = doc(db, 'site_content', 'about_team');
        
        const heroData = {
            title: document.getElementById('about-hero-title').value,
            subtitle: document.getElementById('about-hero-subtitle').value
        };
        
        const missionData = {
            content: document.getElementById('about-mission-content').value
        };
        
        await setDoc(heroRef, heroData);
        await setDoc(missionRef, missionData);
        await setDoc(teamRef, { members: currentTeamMembers });
        
        // Preview sync
        await window.saveAboutContentDraft();
        
        window.showToast("About page published live!", "success");
    } catch (err) {
        console.error("Error saving about page content:", err);
        window.showToast("Failed to publish changes.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

function renderTeamMembersList() {
    const listEl = document.getElementById('team-members-list');
    if (!listEl) return;
    
    if (currentTeamMembers.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-gray-500 italic text-center py-4">No team members added. Click "Add Team Member" above.</p>';
        return;
    }
    
    listEl.innerHTML = currentTeamMembers.map((member, index) => `
        <div class="p-5 bg-gray-950/60 border border-gray-900 rounded-2xl flex flex-col md:flex-row gap-4 items-start relative">
            <button onclick="removeTeamMember(${index})" class="absolute top-4 right-4 text-red-400 hover:text-red-300 text-xs transition">
                <i class="fas fa-trash-alt mr-1"></i> Remove
            </button>
            <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                <i class="fas fa-user-tie"></i>
            </div>
            
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4 md:pt-0">
                <div>
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Member Name</label>
                    <input type="text" value="${member.name}" oninput="updateTeamMemberValue(${index}, 'name', this.value)" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">
                </div>
                <div>
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Role / Title</label>
                    <input type="text" value="${member.role}" oninput="updateTeamMemberValue(${index}, 'role', this.value)" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">
                </div>
                <div>
                    <label class="block text-gray-600 text-[10px] font-bold mb-1 uppercase tracking-wider">Bio Quote</label>
                    <input type="text" value="${member.bio || ''}" placeholder="e.g. Crafted culinary delicacies for 10 years" oninput="updateTeamMemberValue(${index}, 'bio', this.value)" class="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-lg text-xs outline-none focus:border-primary transition">
                </div>
            </div>
        </div>
    `).join('');
}

window.addTeamMember = function() {
    currentTeamMembers.push({
        name: 'John Doe',
        role: 'Head Chef',
        bio: 'Cooking delicious food for 8+ years'
    });
    renderTeamMembersList();
};

window.removeTeamMember = function(index) {
    currentTeamMembers.splice(index, 1);
    renderTeamMembersList();
};

window.updateTeamMemberValue = function(index, key, value) {
    if (currentTeamMembers[index]) {
        currentTeamMembers[index][key] = value;
    }
};

// ==========================================
// 📸 MEDIA GALLERY MANAGEMENT
// ==========================================
function setupGalleryListener() {
    const galleryRef = collection(db, 'gallery_items');
    const q = query(galleryRef, orderBy('createdAt', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        activeGalleryItems = [];
        snapshot.forEach((doc) => {
            activeGalleryItems.push({ id: doc.id, ...doc.data() });
        });
        
        renderGalleryList();
        updateStatCounters();
    });
}

function renderGalleryList() {
    const gridEl = document.getElementById('gallery-items-grid');
    if (!gridEl) return;
    
    let filteredPhotos = activeGalleryItems;
    if (selectedGalleryCategory !== 'ALL') {
        filteredPhotos = filteredPhotos.filter(photo => photo.category === selectedGalleryCategory);
    }
    
    if (filteredPhotos.length === 0) {
        gridEl.innerHTML = `
            <div class="col-span-full p-12 bg-[#121212] border border-gray-900 rounded-3xl text-center text-gray-500 text-sm">
                <i class="fas fa-camera text-4xl text-gray-700 mb-3"></i>
                <p>No photos uploaded to this gallery category yet.</p>
            </div>
        `;
        return;
    }
    
    gridEl.innerHTML = filteredPhotos.map(photo => `
        <div class="bg-[#121212] rounded-2xl border border-gray-900 overflow-hidden shadow-xl hover:border-primary/20 transition-all duration-300 relative group flex flex-col justify-between">
            <div class="relative aspect-square bg-gray-950 flex items-center justify-center overflow-hidden">
                <img src="${photo.imageUrl}" class="w-full h-full object-cover">
                
                <button onclick="deleteGalleryItem('${photo.id}', '${photo.imageUrl}')" 
                    class="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                    title="Delete Image">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
            
            <div class="p-3 bg-gray-950/40">
                <input type="text" value="${photo.caption || ''}" placeholder="Add short caption..." 
                    onchange="updateGalleryCaption('${photo.id}', this.value)"
                    class="w-full bg-transparent text-white placeholder-gray-600 text-xs px-2 py-1 rounded outline-none border border-transparent focus:border-gray-800 transition">
                
                <div class="flex items-center justify-between mt-2 px-2">
                    <span class="text-[9px] font-semibold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded border border-primary/10">${photo.category}</span>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" ${photo.visible !== false ? 'checked' : ''}
                            onchange="toggleGalleryVisible('${photo.id}', ${photo.visible !== false})"
                            class="w-3.5 h-3.5 accent-primary bg-gray-900 border-gray-800 rounded">
                        <span class="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Visible</span>
                    </label>
                </div>
            </div>
        </div>
    `).join('');
}

window.filterGalleryCategory = function(category) {
    selectedGalleryCategory = category;
    
    // Manage filter button active visual styling
    const btnAll = document.getElementById('gallery-filter-all');
    const btnFood = document.getElementById('gallery-filter-food');
    const btnPromo = document.getElementById('gallery-filter-promo');
    
    [btnAll, btnFood, btnPromo].forEach(btn => {
        if (btn) {
            btn.className = "bg-gray-900 border border-gray-800 text-gray-400 px-4 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition whitespace-nowrap";
        }
    });
    
    if (category === 'ALL' && btnAll) btnAll.className = "bg-primary text-[#121212] px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap";
    if (category === 'Food & Atmosphere' && btnFood) btnFood.className = "bg-primary text-[#121212] px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap";
    if (category === 'Specials & Promotions' && btnPromo) btnPromo.className = "bg-primary text-[#121212] px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap";
    
    renderGalleryList();
};

window.uploadGalleryFiles = async function(files) {
    if (!files || files.length === 0) return;
    if (window.showLoading) window.showLoading();
    
    let successCount = 0;
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storagePath = `gallery/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            
            // Upload to storage
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            
            // Map category depending on selection
            const category = selectedGalleryCategory === 'ALL' ? 'Food & Atmosphere' : selectedGalleryCategory;
            
            // Save doc to Firestore
            await addDoc(collection(db, 'gallery_items'), {
                imageUrl: downloadUrl,
                caption: file.name.split('.')[0].replace(/[-_]/g, ' '),
                category: category,
                visible: true,
                order: 0,
                createdAt: serverTimestamp()
            });
            successCount++;
        }
        
        window.showToast(`Successfully uploaded ${successCount} gallery photo(s)!`, "success");
    } catch (err) {
        console.error("Gallery upload error:", err);
        window.showToast("File upload requires Billing. Please use 'Add Photo via Link' instead.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

window.addGalleryItemByUrl = async function() {
    const urlInput = document.getElementById('gallery-image-url');
    const captionInput = document.getElementById('gallery-image-caption');
    
    if (!urlInput) return;
    
    const imageUrl = urlInput.value.trim();
    const caption = (captionInput ? captionInput.value.trim() : '') || 'Gallery Image';
    
    if (!imageUrl) {
        window.showToast("Please enter an image URL.", "error");
        return;
    }
    
    if (window.showLoading) window.showLoading();
    try {
        const category = selectedGalleryCategory === 'ALL' ? 'Food & Atmosphere' : selectedGalleryCategory;
        
        await addDoc(collection(db, 'gallery_items'), {
            imageUrl: imageUrl,
            caption: caption,
            category: category,
            visible: true,
            order: 0,
            createdAt: serverTimestamp()
        });
        
        urlInput.value = '';
        if (captionInput) captionInput.value = '';
        window.showToast("Gallery image link added successfully!", "success");
    } catch (err) {
        console.error("Gallery link add error:", err);
        window.showToast("Could not add gallery item.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

window.deleteGalleryItem = async function(id, imageUrl) {
    if (confirm("Are you sure you want to delete this photo from the gallery?")) {
        if (window.showLoading) window.showLoading();
        try {
            await deleteDoc(doc(db, 'gallery_items', id));
            
            if (imageUrl && imageUrl.includes('firebasestorage')) {
                const storageRef = ref(storage, imageUrl);
                await deleteObject(storageRef);
            }
            
            window.showToast("Photo deleted successfully.", "success");
        } catch (err) {
            console.error("Error deleting gallery photo:", err);
            window.showToast("Failed to delete photo.", "error");
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    }
};

window.updateGalleryCaption = async function(id, caption) {
    try {
        await updateDoc(doc(db, 'gallery_items', id), { caption: caption });
        window.showToast("Caption updated successfully.", "success");
    } catch (err) {
        console.error("Error updating caption:", err);
    }
};

window.toggleGalleryVisible = async function(id, currentVisible) {
    try {
        await updateDoc(doc(db, 'gallery_items', id), { visible: !currentVisible });
        window.showToast("Photo visibility updated.", "success");
    } catch (err) {
        console.error("Error toggling photo visibility:", err);
    }
};

// Drag and drop logic setup
const dropzone = document.getElementById('gallery-dropzone');
if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('border-primary', 'bg-primary/5');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary', 'bg-primary/5');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        window.uploadGalleryFiles(files);
    }, false);
    
    dropzone.addEventListener('click', () => {
        document.getElementById('gallery-image-input').click();
    });
}

// ==========================================
// 📞 CONTACT DETAILS & HOURS
// ==========================================
async function loadContactContent() {
    try {
        const contactDoc = await getDoc(doc(db, 'site_content', 'contact_info'));
        if (contactDoc.exists()) {
            const data = contactDoc.data();
            document.getElementById('contact-street').value = data.street || '';
            document.getElementById('contact-city').value = data.city || '';
            document.getElementById('contact-state').value = data.state || '';
            document.getElementById('contact-zip').value = data.zip || '';
            document.getElementById('contact-phone1').value = data.phone1 || '';
            document.getElementById('contact-phone2').value = data.phone2 || '';
            document.getElementById('contact-email').value = data.email || '';
            document.getElementById('contact-hours').value = data.hours || '';
            document.getElementById('contact-map-link').value = data.mapLink || '';
        }
    } catch (err) {
        console.error("Error loading contact coordinates:", err);
    }
}

window.saveContactContentDraft = async function() {
    const contactRef = doc(db, 'preview_content', 'contact_info');
    await setDoc(contactRef, {
        street: document.getElementById('contact-street').value,
        city: document.getElementById('contact-city').value,
        state: document.getElementById('contact-state').value,
        zip: document.getElementById('contact-zip').value,
        phone1: document.getElementById('contact-phone1').value,
        phone2: document.getElementById('contact-phone2').value,
        email: document.getElementById('contact-email').value,
        hours: document.getElementById('contact-hours').value,
        mapLink: document.getElementById('contact-map-link').value
    });
};

window.saveContactContent = async function() {
    if (window.showLoading) window.showLoading();
    try {
        const contactRef = doc(db, 'site_content', 'contact_info');
        const contactData = {
            street: document.getElementById('contact-street').value,
            city: document.getElementById('contact-city').value,
            state: document.getElementById('contact-state').value,
            zip: document.getElementById('contact-zip').value,
            phone1: document.getElementById('contact-phone1').value,
            phone2: document.getElementById('contact-phone2').value,
            email: document.getElementById('contact-email').value,
            hours: document.getElementById('contact-hours').value,
            mapLink: document.getElementById('contact-map-link').value
        };
        
        await setDoc(contactRef, contactData);
        
        // Preview sync
        await window.saveContactContentDraft();
        
        window.showToast("Contact details published live instantly!", "success");
    } catch (err) {
        console.error("Error saving contact details:", err);
        window.showToast("Failed to save contact settings.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

// ==========================================
// ⚙️ GLOBAL SITE SETTINGS (SEO & Branding)
// ==========================================
async function loadSettings() {
    try {
        const footerDoc = await getDoc(doc(db, 'site_content', 'footer'));
        if (footerDoc.exists()) {
            document.getElementById('settings-footer-desc').value = footerDoc.data().description || '';
        }
        
        const socialDoc = await getDoc(doc(db, 'site_content', 'social_links'));
        if (socialDoc.exists()) {
            const data = socialDoc.data();
            document.getElementById('social-instagram').value = data.instagram || '';
            document.getElementById('social-facebook').value = data.facebook || '';
            document.getElementById('social-youtube').value = data.youtube || '';
            document.getElementById('social-threads').value = data.threads || '';
        }
        
        const seoDoc = await getDoc(doc(db, 'site_content', 'seo_meta'));
        if (seoDoc.exists()) {
            const data = seoDoc.data();
            document.getElementById('seo-title').value = data.title || '';
            document.getElementById('seo-description').value = data.description || '';
        }
    } catch (err) {
        console.error("Error loading branding settings:", err);
    }
}

window.saveSettings = async function() {
    if (window.showLoading) window.showLoading();
    try {
        const footerRef = doc(db, 'site_content', 'footer');
        const socialRef = doc(db, 'site_content', 'social_links');
        const seoRef = doc(db, 'site_content', 'seo_meta');
        
        // Draft sync mirror
        const footerRefDraft = doc(db, 'preview_content', 'footer');
        const socialRefDraft = doc(db, 'preview_content', 'social_links');
        const seoRefDraft = doc(db, 'preview_content', 'seo_meta');
        
        const footerData = { description: document.getElementById('settings-footer-desc').value };
        const socialData = {
            instagram: document.getElementById('social-instagram').value,
            facebook: document.getElementById('social-facebook').value,
            youtube: document.getElementById('social-youtube').value,
            threads: document.getElementById('social-threads').value
        };
        const seoData = {
            title: document.getElementById('seo-title').value,
            description: document.getElementById('seo-description').value
        };
        
        await setDoc(footerRef, footerData);
        await setDoc(socialRef, socialData);
        await setDoc(seoRef, seoData);
        
        // Keep draft in sync
        await setDoc(footerRefDraft, footerData);
        await setDoc(socialRefDraft, socialData);
        await setDoc(seoRefDraft, seoData);
        
        window.showToast("Global configurations saved live!", "success");
    } catch (err) {
        console.error("Error saving global configurations:", err);
        window.showToast("Could not save settings configurations.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

// ==========================================
// 📊 STAT COUNTER HELPERS
// ==========================================
function updateStatCounters() {
    const menuEl = document.getElementById('stat-menu-count');
    const galleryEl = document.getElementById('stat-gallery-count');
    const offersEl = document.getElementById('stat-offers-count');
    
    if (menuEl) menuEl.innerText = activeMenuItems.length;
    if (galleryEl) galleryEl.innerText = activeGalleryItems.length;
    
    if (offersEl) {
        // Count ONLY active offers (time within range + enabled)
        const now = Date.now();
        const activeCount = activeOffers.filter(off => {
            const start = new Date(off.startDate).getTime();
            const end = new Date(off.endDate).getTime();
            return off.enabled && now >= start && now <= end;
        }).length;
        offersEl.innerText = activeCount;
        
        const dashboardOffersStat = document.getElementById('stat-offers-count');
        if (dashboardOffersStat) dashboardOffersStat.innerText = activeCount;
    }
}

// ==========================================
// 🛠️ DATE & FORMATTING HELPERS
// ==========================================
function formatDate(dateTimeStr) {
    if (!dateTimeStr) return '--';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatLocalDateTime(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
}

function getIconString(iconKey) {
    const iconMap = {
        sun: 'sun',
        fire: 'fire',
        star: 'star',
        gift: 'gift',
        percent: 'percent',
        bolt: 'bolt'
    };
    return iconMap[iconKey] || 'sun';
}

// ==========================================
// 🛠️ DATABASE SEEDING & SETUP ASSIST
// ==========================================
async function checkDatabaseEmpty() {
    try {
        const menuSnap = await getDocs(query(collection(db, 'menu_items'), limit(1)));
        const heroDoc = await getDoc(doc(db, 'site_content', 'home_hero'));
        if (menuSnap.empty && !heroDoc.exists()) {
            const seedCard = document.getElementById('seed-database-card');
            if (seedCard) seedCard.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Error checking empty database state:", err);
    }
}

window.seedDatabaseFromLiveSite = async function(isManual = false) {
    if (isManual) {
        const confirmSync = confirm("This will re-sync all data from the website pages to the admin panel. Any manual changes not synced back might be replaced. Do you want to continue?");
        if (!confirmSync) return;
    }
    
    const btn = document.getElementById('seed-db-btn');
    const headerBtn = document.getElementById('header-sync-db-btn');
    const settingsBtn = document.getElementById('settings-sync-db-btn');
    const overviewSyncBtn = document.getElementById('btn-sync-live-data');
    const seedCard = document.getElementById('seed-database-card');
    
    const disableButtons = () => {
        if (window.showLoading) window.showLoading();
        [btn, headerBtn, settingsBtn, overviewSyncBtn].forEach(b => {
            if (b) {
                b.disabled = true;
                b.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Syncing...`;
            }
        });
    };
    
    const enableButtons = () => {
        if (window.hideLoading) window.hideLoading();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-cloud-arrow-down"></i> Import Current Site Content`;
        }
        if (headerBtn) {
            headerBtn.disabled = false;
            headerBtn.innerHTML = `<i class="fas fa-sync-alt mr-1"></i> UPDATE WEBSITE TO ADMIN PANEL`;
        }
        if (settingsBtn) {
            settingsBtn.disabled = false;
            settingsBtn.innerHTML = `<i class="fas fa-sync-alt mr-2"></i> Update Website to Admin Panel`;
        }
        if (overviewSyncBtn) {
            overviewSyncBtn.disabled = false;
            overviewSyncBtn.innerHTML = `<i class="fas fa-sync-alt mr-2"></i> Update Website to Admin Panel`;
        }
    };
    
    disableButtons();
    
    try {
        const parser = new DOMParser();
        
        // -------------------------------------------------------------
        // PRE-CLEANUP: Clear existing menu_items and gallery_items
        // to prevent duplicates and ensure clean state
        // -------------------------------------------------------------
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Clearing old entries...`;
        if (headerBtn) headerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Clearing...`;
        
        const menuSnap = await getDocs(collection(db, 'menu_items'));
        const gallerySnap = await getDocs(collection(db, 'gallery_items'));
        
        // Delete menu_items in batches of 400
        let deleteBatch = writeBatch(db);
        let opCount = 0;
        
        for (let docSnap of menuSnap.docs) {
            deleteBatch.delete(docSnap.ref);
            opCount++;
            if (opCount >= 400) {
                await deleteBatch.commit();
                deleteBatch = writeBatch(db);
                opCount = 0;
            }
        }
        
        for (let docSnap of gallerySnap.docs) {
            deleteBatch.delete(docSnap.ref);
            opCount++;
            if (opCount >= 400) {
                await deleteBatch.commit();
                deleteBatch = writeBatch(db);
                opCount = 0;
            }
        }
        
        if (opCount > 0) {
            await deleteBatch.commit();
        }
        
        // -------------------------------------------------------------
        // 1. HOME PAGE & GENERAL SETTINGS (SEO, Footer, Socials)
        // -------------------------------------------------------------
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Importing Home Page & SEO...`;
        if (headerBtn) headerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Home...`;
        
        const homeRes = await fetch('../index.html?t=' + Date.now());
        if (!homeRes.ok) throw new Error("Could not fetch index.html");
        const homeHtml = await homeRes.text();
        const homeDoc = parser.parseFromString(homeHtml, 'text/html');
        
        // Hero
        const heroSubtitle = homeDoc.querySelector('.hero-content span')?.textContent?.trim() || "Taste of Authenticity";
        const heroTitle = homeDoc.querySelector('.hero-content h1')?.textContent?.trim()?.replace(/\s+/g, ' ') || "Authentic Hyderabadi Dum Biryani in McKinney, TX";
        const heroDesc = homeDoc.querySelector('.hero-content p')?.textContent?.trim()?.replace(/\s+/g, ' ') || "Experience the royal legacy of the Nizams with our signature Hyderabadi Dum Biryani. Slow-cooked to perfection.";
        
        // Story
        const storyTitle = homeDoc.querySelector('#story h2')?.textContent?.trim()?.replace(/\s+/g, ' ') || "Bringing Hyderabad to McKinney";
        const storyParas = homeDoc.querySelectorAll('#story p');
        const storyP1 = storyParas[0]?.textContent?.trim()?.replace(/\s+/g, ' ') || "At Famous HD Biryani, we believe that food is not just about taste, but an emotion. Our journey began with a simple desire: to serve the most authentic Hyderabadi cuisine that reminds you of home.";
        const storyP2 = storyParas[1]?.textContent?.trim()?.replace(/\s+/g, ' ') || "Every grain of rice in our Biryani tells a story of tradition. We use the ancient 'Kacchi Gosht' technique where raw marinated meat is layered with half-cooked rice and slow-cooked in a sealed clay pot.";
        
        // Testimonials
        const testimonialCards = homeDoc.querySelectorAll('.testimonial-card');
        const testimonialsList = [];
        testimonialCards.forEach(card => {
            const inner = card.querySelector('.testimonial-card-inner') || card;
            const text = inner.querySelector('p.italic')?.textContent?.trim()?.replace(/(^"|"$)/g, '') || inner.querySelector('p')?.textContent?.trim()?.replace(/(^"|"$)/g, '') || "";
            const name = inner.querySelector('h4')?.textContent?.trim() || "Anonymous Customer";
            const role = inner.querySelector('p.text-xs')?.textContent?.trim() || "Local Guide";
            const initials = inner.querySelector('.w-10.h-10')?.textContent?.trim() || name.substring(0, 2).toUpperCase();
            
            // Count stars
            const stars = inner.querySelectorAll('.fa-star').length || 5;
            
            if (text) {
                testimonialsList.push({
                    name,
                    initials,
                    rating: stars,
                    text
                });
            }
        });
        
        if (testimonialsList.length === 0) {
            testimonialsList.push(
                { name: "John D.", initials: "JD", rating: 5, text: "Hands down the best Biryani in Texas. The spice level was perfect and the meat was falling off the bone. Takes me back to Hyderabad!" },
                { name: "Sarah M.", initials: "SM", rating: 5, text: "The service is outstanding and the Dum Pulav is out of this world. Highly recommend this culinary gem in McKinney." }
            );
        }
        
        // SEO & Meta
        const seoTitle = homeDoc.querySelector('title')?.textContent?.trim() || "Famous HD Biryani - Authentic Hyderabadi Dum Biryani in McKinney, TX";
        const seoDesc = homeDoc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || "Taste the royal heritage of Hyderabad dum biryani in McKinney, TX. Crafted with organic ingredients and traditional spices.";
        
        // Socials & Footer
        const footerDesc = homeDoc.querySelector('footer p')?.textContent?.trim() || "Taste the legacy of Hyderabadi dum biryani, crafted with passion and served with pride.";
        const socialInsta = homeDoc.querySelector('a[href*="instagram.com"]')?.getAttribute('href') || "";
        const socialFb = homeDoc.querySelector('a[href*="facebook.com"]')?.getAttribute('href') || "";
        const socialYt = homeDoc.querySelector('a[href*="youtube.com"]')?.getAttribute('href') || "";
        
        // Write Homepage and SEO Docs
        const homeHeroData = { subtitle: heroSubtitle, title: heroTitle, description: heroDesc };
        const homeStoryData = { title: storyTitle, paragraph1: storyP1, paragraph2: storyP2 };
        const homeTestimonialsData = { testimonials: testimonialsList };
        const seoData = { title: seoTitle, description: seoDesc };
        const footerData = { description: footerDesc };
        const socialData = { instagram: socialInsta, facebook: socialFb, youtube: socialYt, threads: "" };
        
        await setDoc(doc(db, 'site_content', 'home_hero'), homeHeroData);
        await setDoc(doc(db, 'site_content', 'home_story'), homeStoryData);
        await setDoc(doc(db, 'site_content', 'home_testimonials'), homeTestimonialsData);
        await setDoc(doc(db, 'site_content', 'seo_meta'), seoData);
        await setDoc(doc(db, 'site_content', 'footer'), footerData);
        await setDoc(doc(db, 'site_content', 'social_links'), socialData);
        
        // Mirror to preview
        await setDoc(doc(db, 'preview_content', 'home_hero'), homeHeroData);
        await setDoc(doc(db, 'preview_content', 'home_story'), homeStoryData);
        await setDoc(doc(db, 'preview_content', 'home_testimonials'), homeTestimonialsData);
        await setDoc(doc(db, 'preview_content', 'seo_meta'), seoData);
        await setDoc(doc(db, 'preview_content', 'footer'), footerData);
        await setDoc(doc(db, 'preview_content', 'social_links'), socialData);
        
        // -------------------------------------------------------------
        // 2. ABOUT PAGE
        // -------------------------------------------------------------
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Importing About Page...`;
        if (headerBtn) headerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> About...`;
        
        const aboutRes = await fetch('../about.html?t=' + Date.now());
        let aboutTitle = "The Royal Story of Hyderabadi Dum Biryani";
        let aboutSubtitle = "Born in the royal kitchens of Hyderabad, perfected through centuries of tradition, and now served in the heart of Texas.";
        let aboutMission = "Hyderabadi Dum Biryani traces its roots to the royal kitchens of the Nizams of Hyderabad. Crafted with patience, aromatic spices, and slow dum cooking, this dish became a symbol of royal hospitality and culinary mastery. Each grain of rice absorbs the essence of carefully blended spices, creating a dish that is both fragrant and unforgettable. We honor this ancient tradition in every pot we prepare.";
        
        if (aboutRes.ok) {
            const aboutHtml = await aboutRes.text();
            const aboutDoc = parser.parseFromString(aboutHtml, 'text/html');
            aboutTitle = aboutDoc.querySelector('#hero-section h1')?.textContent?.trim()?.replace(/\s+/g, ' ') || aboutTitle;
            aboutSubtitle = aboutDoc.querySelector('#hero-section p')?.textContent?.trim()?.replace(/\s+/g, ' ') || aboutSubtitle;
            
            const leadParas = Array.from(aboutDoc.querySelectorAll('p.leading-loose')).map(p => p.textContent.trim().replace(/\s+/g, ' '));
            if (leadParas.length > 0) {
                aboutMission = leadParas.join('\n\n');
            }
        }
        
        const defaultTeam = [
            { name: "Chef Khaleel", role: "Head Culinary Artist", bio: "Over 20 years of experience crafting authentic Nizami delicacies." },
            { name: "Mirza Ahmed", role: "Master Sommelier & Spiceman", bio: "Curates our premium hand-ground spices and organic ingredients." }
        ];
        
        const aboutHeroData = { title: aboutTitle, subtitle: aboutSubtitle };
        const aboutMissionData = { content: aboutMission };
        const aboutTeamData = { members: defaultTeam };
        
        await setDoc(doc(db, 'site_content', 'about_hero'), aboutHeroData);
        await setDoc(doc(db, 'site_content', 'about_mission'), aboutMissionData);
        await setDoc(doc(db, 'site_content', 'about_team'), aboutTeamData);
        
        await setDoc(doc(db, 'preview_content', 'about_hero'), aboutHeroData);
        await setDoc(doc(db, 'preview_content', 'about_mission'), aboutMissionData);
        await setDoc(doc(db, 'preview_content', 'about_team'), aboutTeamData);
        
        // -------------------------------------------------------------
        // 3. CONTACT PAGE
        // -------------------------------------------------------------
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Importing Contact...`;
        if (headerBtn) headerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Contact...`;
        
        const contactRes = await fetch('../contact.html?t=' + Date.now());
        let street = "3300 Eldorado Pkwy, STE 100";
        let city = "McKinney";
        let state = "TX";
        let zip = "75070";
        let phone1 = "214-548-5462";
        let phone2 = "214-548-5464";
        let email = "famoushdbiryani@gmail.com";
        let hours = "Tue - Sun: 11:00 AM - 10:00 PM\nMon: Closed";
        let mapLink = "https://maps.google.com/?q=Famous+HD+Biryani+McKinney";
        
        if (contactRes.ok) {
            const contactHtml = await contactRes.text();
            const contactDoc = parser.parseFromString(contactHtml, 'text/html');
            
            const contactCards = contactDoc.querySelectorAll('.contact-card');
            contactCards.forEach(card => {
                const titleText = card.querySelector('h3')?.textContent?.trim() || "";
                const contentText = card.querySelector('p')?.textContent?.trim() || "";
                
                if (titleText.includes("Location")) {
                    const match = contentText.match(/([^,]+),\s*([^\s]+)\s*([A-Z]{2})\s*(\d{5})/);
                    if (match) {
                        street = match[1].trim();
                        city = match[2].trim();
                        state = match[3].trim();
                        zip = match[4].trim();
                    } else {
                        const lines = contentText.split('\n').map(l => l.trim()).filter(Boolean);
                        if (lines[0]) street = lines[0];
                        if (lines[1]) {
                            const cs = lines[1].split(',');
                            if (cs[0]) city = cs[0].trim();
                            if (cs[1]) {
                                const parts = cs[1].trim().split(/\s+/);
                                if (parts[0]) state = parts[0];
                                if (parts[1]) zip = parts[1];
                            }
                        }
                    }
                    const dynamicMap = card.querySelector('a')?.getAttribute('href');
                    if (dynamicMap) mapLink = dynamicMap;
                } else if (titleText.includes("Call")) {
                    const links = Array.from(card.querySelectorAll('a[href^="tel:"]')).map(a => a.textContent.trim());
                    if (links[0]) phone1 = links[0];
                    if (links[1]) phone2 = links[1];
                } else if (titleText.includes("Email")) {
                    const dynamicEmail = card.querySelector('a[href^="mailto:"]')?.textContent?.trim();
                    if (dynamicEmail) email = dynamicEmail;
                } else if (titleText.includes("Hours")) {
                    hours = Array.from(card.querySelector('p').childNodes)
                        .map(n => n.nodeType === Node.TEXT_NODE ? n.textContent.trim() : (n.nodeName === 'BR' ? '\n' : ''))
                        .join('')
                        .trim();
                }
            });
        }
        
        const contactData = { street, city, state, zip, phone1, phone2, email, hours, mapLink };
        await setDoc(doc(db, 'site_content', 'contact_info'), contactData);
        await setDoc(doc(db, 'preview_content', 'contact_info'), contactData);
        
        // -------------------------------------------------------------
        // 4. GALLERY PHOTOS (Batch Seeding)
        // -------------------------------------------------------------
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Importing Gallery...`;
        if (headerBtn) headerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Gallery...`;
        
        const galleryRes = await fetch('../gallery.html?t=' + Date.now());
        let galleryCount = 0;
        
        if (galleryRes.ok) {
            const galleryHtml = await galleryRes.text();
            const galleryDoc = parser.parseFromString(galleryHtml, 'text/html');
            
            let galleryBatch = writeBatch(db);
            let gOpCount = 0;
            
            // Food & Atmosphere
            const foodImages = galleryDoc.querySelectorAll('#food-atmosphere-grid img');
            for (let img of foodImages) {
                const imageUrl = img.getAttribute('src');
                if (!imageUrl) continue;
                
                const alt = img.getAttribute('alt') || "Famous HD Biryani Food Atmosphere";
                const caption = alt.replace(/\s*-\s*Food\s*&\s*Atmosphere/gi, '').trim();
                
                const newDocRef = doc(collection(db, 'gallery_items'));
                galleryBatch.set(newDocRef, {
                    imageUrl,
                    caption,
                    category: "Food & Atmosphere",
                    visible: true,
                    order: 0,
                    createdAt: serverTimestamp()
                });
                
                galleryCount++;
                gOpCount++;
                if (gOpCount >= 400) {
                    await galleryBatch.commit();
                    galleryBatch = writeBatch(db);
                    gOpCount = 0;
                }
            }
            
            // Specials & Promotions
            const promoImages = galleryDoc.querySelectorAll('#specials-promotional-grid img');
            for (let img of promoImages) {
                const imageUrl = img.getAttribute('src');
                if (!imageUrl) continue;
                
                const alt = img.getAttribute('alt') || "Special Promotion Poster";
                const caption = alt.trim();
                
                const newDocRef = doc(collection(db, 'gallery_items'));
                galleryBatch.set(newDocRef, {
                    imageUrl,
                    caption,
                    category: "Specials & Promotions",
                    visible: true,
                    order: 0,
                    createdAt: serverTimestamp()
                });
                
                galleryCount++;
                gOpCount++;
                if (gOpCount >= 400) {
                    await galleryBatch.commit();
                    galleryBatch = writeBatch(db);
                    gOpCount = 0;
                }
            }
            
            if (gOpCount > 0) {
                await galleryBatch.commit();
            }
        }
        
        // -------------------------------------------------------------
        // 5. MENU MANAGEMENT (Batch Seeding)
        // -------------------------------------------------------------
        if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Importing Menu Dishes...`;
        if (headerBtn) headerBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Menu...`;
        
        const menuRes = await fetch('../menu.html?t=' + Date.now());
        if (!menuRes.ok) throw new Error("Could not fetch menu.html");
        const menuHtml = await menuRes.text();
        const menuDoc = parser.parseFromString(menuHtml, 'text/html');
        
        const menuCards = menuDoc.querySelectorAll('.menu-item-card, [data-dish-id], .group[data-search]');
        
        const catMap = {
            "Quick Bites": "Quick Bites",
            "Veg Appetizers": "Veg Appetizers",
            "Non-Veg Appetizers": "Non-Veg Appetizers",
            "Vegetarian Curries": "Veg Curries",
            "Non-Veg Curries": "Non-Veg Curries",
            "Breads / Naan / Roti": "Breads",
            "Indo-Chinese": "Indo-Chinese",
            "Tandoori / Kebabs": "Tandoori",
            "Tandoori": "Tandoori",
            "Regular Biryanis": "Biryanis",
            "Pulavs": "Pulavs",
            "Tiffin Specials": "Tiffins",
            "Chaat / Street Snacks": "Chaat",
            "Kids Menu": "Kids",
            "Desserts": "Desserts",
            "Beverages": "Drinks"
        };
        
        let menuCount = 0;
        let menuBatch = writeBatch(db);
        let mOpCount = 0;
        const addedDishes = new Set();
        
        for (let card of menuCards) {
            const name = card.querySelector('.dish-name')?.textContent?.trim() || card.querySelector('h3')?.textContent?.trim() || "";
            if (!name || addedDishes.has(name)) continue;
            addedDishes.add(name);
            
            const desc = card.querySelector('.dish-desc')?.textContent?.trim() || card.querySelector('p')?.textContent?.trim() || "";
            const priceText = card.querySelector('.dish-price')?.textContent?.trim() || card.querySelector('span.text-primary')?.textContent?.trim() || "";
            const price = priceText.replace(/[^0-9.]/g, '');
            
            const isVeg = card.getAttribute('data-veg') === 'true' || card.querySelector('.badge-sm')?.textContent?.includes('VEG') || false;
            const dietary = isVeg ? 'veg' : 'non-veg';
            
            // Determine category
            const categoryEl = card.closest('.menu-category');
            let categoryText = "Quick Bites";
            if (categoryEl) {
                const headerText = categoryEl.querySelector('h2')?.textContent?.trim();
                if (headerText) {
                    const normHeader = headerText.toLowerCase().replace(/\s+/g, ' ').trim();
                    if (normHeader.includes("vegetarian curries") || normHeader.includes("veg curries")) {
                        categoryText = "Veg Curries";
                    } else if (normHeader.includes("non-veg curries")) {
                        categoryText = "Non-Veg Curries";
                    } else if (normHeader.includes("bread") || normHeader.includes("naan") || normHeader.includes("roti")) {
                        categoryText = "Breads";
                    } else if (normHeader.includes("biryani")) {
                        categoryText = "Biryanis";
                    } else if (normHeader.includes("pulav")) {
                        categoryText = "Pulavs";
                    } else if (normHeader.includes("tiffin")) {
                        categoryText = "Tiffins";
                    } else if (normHeader.includes("chaat") || normHeader.includes("street")) {
                        categoryText = "Chaat";
                    } else if (normHeader.includes("kids")) {
                        categoryText = "Kids";
                    } else if (normHeader.includes("dessert")) {
                        categoryText = "Desserts";
                    } else if (normHeader.includes("beverage") || normHeader.includes("drink")) {
                        categoryText = "Drinks";
                    } else if (normHeader.includes("indo-chinese")) {
                        categoryText = "Indo-Chinese";
                    } else if (normHeader.includes("tandoori") || normHeader.includes("kebab")) {
                        categoryText = "Tandoori";
                    } else if (normHeader.includes("veg appetizer")) {
                        categoryText = "Veg Appetizers";
                    } else if (normHeader.includes("non-veg appetizer")) {
                        categoryText = "Non-Veg Appetizers";
                    } else if (normHeader.includes("quick bite")) {
                        categoryText = "Quick Bites";
                    } else {
                        if (catMap[headerText]) {
                            categoryText = catMap[headerText];
                        } else {
                            categoryText = headerText;
                        }
                    }
                }
            }
            
            const imageUrl = card.querySelector('img')?.getAttribute('src') || "";
            
            // Check extra badges
            let badge = "";
            const badgesArea = card.querySelector('.flex.flex-wrap.items-center');
            if (badgesArea) {
                const spans = badgesArea.querySelectorAll('span');
                spans.forEach(span => {
                    const txt = span.textContent.trim();
                    if (txt !== "VEG" && txt !== "NON-VEG" && !txt.includes("$")) {
                        badge = txt;
                    }
                });
            }
            
            const newDocRef = doc(collection(db, 'menu_items'));
            menuBatch.set(newDocRef, {
                name,
                price,
                category: categoryText,
                dietary,
                description: desc,
                badge,
                visible: true,
                imageUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            menuCount++;
            mOpCount++;
            if (mOpCount >= 400) {
                await menuBatch.commit();
                menuBatch = writeBatch(db);
                mOpCount = 0;
            }
        }
        
        if (mOpCount > 0) {
            await menuBatch.commit();
        }
        
        if (window.showToast) {
            window.showToast(`Imported all ${menuCount} menu items, ${galleryCount} gallery images, and pages successfully!`, "success");
        }
        
        if (seedCard) seedCard.classList.add('hidden');
        
        // Re-initialize state and refresh forms
        initializeAdmin();
        
    } catch (err) {
        console.error("Seeding operation failed:", err);
        if (window.showToast) window.showToast(`Sync failed: ${err.message}`, "error");
    } finally {
        enableButtons();
    }
};
