// admin/js/app.js
// Central Administration Controller for Famous HD Biryani

import { db, storage, auth } from './firebase-config.js';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, setDoc, query, orderBy, onSnapshot, where, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { 
    ref, uploadBytes, getDownloadURL, deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';

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
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not authenticated, redirect to login
        if (window.location.pathname.includes('dashboard.html')) {
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

        // Initialize listeners
        initializeAdmin();
    }
});

// Initialize listeners and load data
function initializeAdmin() {
    if (auth.app.options.apiKey === 'REPLACE_WITH_YOUR_API_KEY') {
        if (window.hideLoading) window.hideLoading();
        return;
    }

    // Set up Firestore Listeners
    setupOffersListener();
    setupMenuListener();
    setupGalleryListener();
    
    // Load Static Pages Content
    loadHomeContent();
    loadAboutContent();
    loadContactContent();
    loadSettings();
    
    if (window.hideLoading) window.hideLoading();
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
    
    onSnapshot(q, (snapshot) => {
        activeMenuItems = [];
        snapshot.forEach((doc) => {
            activeMenuItems.push({ id: doc.id, ...doc.data() });
        });
        
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
    `);
}

window.filterMenuCategory = function(category) {
    selectedMenuCategory = category;
    renderMenuList();
};

window.filterMenuSearch = function() {
    renderMenuList();
};

window.openMenuModal = function() {
    document.getElementById('menu-item-form').reset();
    document.getElementById('menu-edit-id').value = '';
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
                const storagePath = `menu_images/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            } else if (id) {
                // Keep existing image if not uploading new
                const existingSnap = await getDoc(doc(db, 'menu_items', id));
                if (existingSnap.exists()) {
                    imageUrl = existingSnap.data().imageUrl || '';
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
        window.showToast("Could not complete gallery media uploads.", "error");
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
