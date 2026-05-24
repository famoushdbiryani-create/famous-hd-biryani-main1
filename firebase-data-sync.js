// firebase-data-sync.js
// Dynamic Firestore Content Sync & Time-Based Promotion Controller
// Loaded by public pages: index.html, menu.html, about.html, contact.html, gallery.html

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { 
    getFirestore, doc, getDoc, collection, getDocs, query, orderBy, where, onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Central configuration - SAME credentials as admin/js/firebase-config.js
// Find these at: Firebase Console → Project Settings → General
const firebaseConfig = {
    apiKey: "AIzaSyBVVrUJgA7sZF_v4Qv5IdsuRD2XIplw6X8",
    authDomain: "famous-hd-biryani-new.firebaseapp.com",
    projectId: "famous-hd-biryani-new",
    storageBucket: "famous-hd-biryani-new.firebasestorage.app",
    messagingSenderId: "192509334649",
    appId: "1:192509334649:web:7d7e50ada7bdbb1a6430a8"
};

// Check if credentials are set. If placeholder, silently abort to avoid breaking static fallback website
if (firebaseConfig.apiKey === 'REPLACE_WITH_YOUR_API_KEY') {
    console.warn("Famous HD Biryani: Firebase configuration parameters not set. Static HTML fallbacks active.");
} else {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Document Ready Sync Trigger
    document.addEventListener('DOMContentLoaded', () => {
        const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
        const contentCollection = isPreview ? 'preview_content' : 'site_content';
        
        console.log(`Famous HD Biryani Sync: Active Mode: [${isPreview ? 'PREVIEW STAGING' : 'LIVE PRODUCTION'}]`);
        
        // 1. Sync Offers & Time-based Popups on ALL pages
        syncOffers(db);
        
        // 2. Sync Page Content based on pathname detection
        const path = window.location.pathname;
        
        if (path === '/' || path.includes('index.html') || path === '/FHDB-WEBSITE-DEPLOY-0/' || path.includes('FHDB-WEBSITE-DEPLOY-0/index.html')) {
            syncHomePage(db, contentCollection);
        }
        if (path.includes('menu')) {
            const menuColl = isPreview ? 'menu_items' : 'menu_items_live';
            syncMenuPage(db, menuColl);
        }
        if (path.includes('about')) {
            syncAboutPage(db, contentCollection);
        }
        if (path.includes('gallery')) {
            syncGalleryPage(db);
        }
        if (path.includes('contact')) {
            syncContactPage(db, contentCollection);
        }
        
        // Always sync branding elements like social handles, footer and title prefix on all pages
        syncBrandingAndSEO(db, contentCollection);
    });
}

// ==========================================
// 🔥 OFFERS & TIMED POPUPS SYNC
// ==========================================
async function syncOffers(db) {
    try {
        const offersRef = collection(db, 'offers');
        const q = query(offersRef, where('enabled', '==', true));
        const querySnapshot = await getDocs(q);
        
        const now = Date.now();
        let activeOffer = null;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const start = new Date(data.startDate).getTime();
            const end = new Date(data.endDate).getTime();
            
            // Check if current time is within schedule
            if (now >= start && now <= end) {
                activeOffer = { id: doc.id, ...data };
            }
        });
        
        if (activeOffer) {
            console.log("Offers Sync: Active promotion found:", activeOffer.title);
            injectOfferElements(activeOffer);
        } else {
            console.log("Offers Sync: No scheduled promotions active at this time.");
        }
    } catch (err) {
        console.error("Error synchronizing offers:", err);
    }
}

function injectOfferElements(offer) {
    // Inject custom styling variables and class definitions if not already in document
    if (!document.getElementById('offer-sync-styles')) {
        const style = document.createElement('style');
        style.id = 'offer-sync-styles';
        style.innerHTML = `
            .offer-marquee-container {
                background: #C8A45D;
                color: #121212;
                padding: 10px 0;
                overflow: hidden;
                white-space: nowrap;
                position: sticky;
                top: 70px;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .offer-marquee-content {
                display: inline-block;
                animation: marquee-infinite 45s linear infinite;
                font-family: 'Poppins', sans-serif;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-size: 13px;
            }
            @keyframes marquee-infinite {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
            }
            .popup-glass {
                background: rgba(10, 10, 10, 0.75);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(200, 164, 93, 0.25);
            }
            .gold-glow {
                box-shadow: 0 0 40px rgba(200, 164, 93, 0.2);
            }
            .glow-pulse {
                animation: glow-pulse-key 2.5s infinite alternate;
            }
            @keyframes glow-pulse-key {
                0% { box-shadow: 0 0 20px rgba(200, 164, 93, 0.1); }
                100% { box-shadow: 0 0 35px rgba(200, 164, 93, 0.35); }
            }
        `;
        document.head.appendChild(style);
    }

    // 1. MARQUEE BANNER
    if (offer.bannerEnabled && offer.bannerText) {
        const headerRoot = document.querySelector('[data-site-header-root]') || document.querySelector('header');
        if (headerRoot) {
            // Check if banner already exists
            let banner = document.getElementById('sync-offer-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'sync-offer-banner';
                banner.className = 'offer-marquee-container';
                headerRoot.after(banner);
            }
            
            // Double the text to ensure continuous scrolling marquee loop without white spaces
            const marqueeLine = `${offer.bannerText} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; `.repeat(8);
            banner.innerHTML = `<div class="offer-marquee-content">${marqueeLine}</div>`;
        }
    }

    // 2. HERO BADGE
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && !document.getElementById('sync-hero-badge')) {
        const badge = document.createElement('div');
        badge.id = 'sync-hero-badge';
        badge.className = 'inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 rounded-full text-xs font-semibold text-primary mb-6 glow-pulse';
        
        const iconName = getIconClass(offer.icon);
        badge.innerHTML = `
            <i class="fas fa-${iconName} animate-bounce"></i>
            <span class="tracking-widest uppercase">${offer.title} • ${offer.discount}</span>
        `;
        heroContent.prepend(badge);
    }

    // 3. POPUP MODAL
    if (offer.popupEnabled) {
        // Only trigger popup if not closed in this session (avoid annoying clients)
        const isClosed = sessionStorage.getItem(`promo-closed-${offer.id}`) === 'true';
        if (!isClosed) {
            setTimeout(() => {
                let popup = document.getElementById('sync-offer-popup');
                if (!popup) {
                    popup = document.createElement('div');
                    popup.id = 'sync-offer-popup';
                    popup.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-300';
                    document.body.appendChild(popup);
                }
                
                const iconName = getIconClass(offer.icon);
                popup.innerHTML = `
                    <div class="popup-glass w-full max-w-lg rounded-3xl p-8 md:p-10 text-center relative gold-glow animate-in fade-in zoom-in duration-500">
                        <button onclick="closeSyncPopup('${offer.id}')" class="absolute top-5 right-5 text-gray-500 hover:text-white transition">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                        
                        <div class="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl mx-auto mb-6 glow-pulse">
                            <i class="fas fa-${iconName}"></i>
                        </div>
                        
                        <span class="text-xs font-bold text-primary tracking-widest uppercase mb-2 block">${offer.title}</span>
                        <h3 class="font-display text-3xl font-bold text-white mb-3 tracking-wide">${offer.discount}</h3>
                        
                        <p class="text-gray-400 text-sm leading-relaxed mb-8">${offer.description || ''}</p>
                        
                        <div class="flex flex-col gap-3">
                            ${offer.ctaLink ? `
                                <a href="${offer.ctaLink}" target="_blank" class="w-full bg-primary hover:bg-primary-hover text-[#121212] font-bold py-4 rounded-xl shadow-lg shadow-primary/15 transition block text-sm">
                                    ${offer.ctaText || 'CLAIM OFFER NOW'}
                                </a>
                            ` : ''}
                            <button onclick="closeSyncPopup('${offer.id}')" class="text-xs text-gray-500 hover:text-white transition py-2 font-semibold">
                                NO THANKS, I WANT TO BROWSE MENU
                            </button>
                        </div>
                    </div>
                `;
                
                // Add click listener outside to close
                popup.addEventListener('click', (e) => {
                    if (e.target === popup) {
                        window.closeSyncPopup(offer.id);
                    }
                });
                
                // Add global escape close key
                const handleEsc = (e) => {
                    if (e.key === 'Escape') {
                        window.closeSyncPopup(offer.id);
                        document.removeEventListener('keydown', handleEsc);
                    }
                };
                document.addEventListener('keydown', handleEsc);
                
            }, 800); // 800ms delay after load
        }
    }
}

// Global Close Hook for dynamically injected modal
window.closeSyncPopup = function(id) {
    const popup = document.getElementById('sync-offer-popup');
    if (popup) {
        popup.classList.add('opacity-0');
        setTimeout(() => {
            popup.remove();
            sessionStorage.setItem(`promo-closed-${id}`, 'true');
        }, 300);
    }
};

// ==========================================
// 🏠 HOME PAGE OVERLAYS
// ==========================================
async function syncHomePage(db, collectionName) {
    try {
        // Hero section
        const heroDoc = await getDoc(doc(db, collectionName, 'home_hero'));
        if (heroDoc.exists()) {
            const data = heroDoc.data();
            const subtitle = document.querySelector('.hero-content .text-primary.font-display') || document.querySelector('.hero-content span');
            const title = document.querySelector('.hero-content h1');
            const desc = document.querySelector('.hero-content p');
            
            if (subtitle && data.subtitle) subtitle.innerText = data.subtitle;
            if (title && data.title) title.innerText = data.title;
            if (desc && data.description) desc.innerText = data.description;
        }
        
        // Story section
        const storyDoc = await getDoc(doc(db, collectionName, 'home_story'));
        if (storyDoc.exists()) {
            const data = storyDoc.data();
            const storyTitle = document.querySelector('#story h2') || document.querySelector('#story-section h2');
            const storyParas = document.querySelectorAll('#story p, #story-section p');
            
            if (storyTitle && data.title) storyTitle.innerText = data.title;
            if (storyParas.length > 0) {
                if (data.paragraph1) storyParas[0].innerText = data.paragraph1;
                if (storyParas.length > 1 && data.paragraph2) storyParas[1].innerText = data.paragraph2;
            }
        }
        
        // Testimonials section
        const testDoc = await getDoc(doc(db, collectionName, 'home_testimonials'));
        if (testDoc.exists()) {
            const reviews = testDoc.data().testimonials || [];
            if (reviews.length > 0) {
                // Find grid testimonials elements
                const testimonialGrid = document.querySelector('#testimonials-section .fluid-grid') || document.querySelector('#testimonials .grid');
                if (testimonialGrid) {
                    testimonialGrid.innerHTML = reviews.map(rev => `
                        <div class="bg-[#121212] p-8 rounded-3xl border border-gray-900 shadow-xl flex flex-col justify-between hover:border-primary/20 transition duration-300">
                            <div>
                                <div class="flex text-primary gap-1 mb-5">
                                    ${'<i class="fas fa-star text-xs"></i>'.repeat(rev.rating || 5)}
                                </div>
                                <p class="text-gray-400 text-sm leading-relaxed italic mb-6">"${rev.text}"</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                    ${rev.initials || rev.name.slice(0, 2)}
                                </div>
                                <div>
                                    <h4 class="text-white text-xs font-bold tracking-wider">${rev.name}</h4>
                                    <p class="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Verified Customer</p>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (err) {
        console.error("Error overlaying homepage details:", err);
    }
}

// ==========================================
// 🍽️ MENU DYNAMIC INJECTION
// ==========================================
async function syncMenuPage(db, collectionName) {
    try {
        const menuRef = collection(db, collectionName);
        const q = query(menuRef, where('visible', '==', true));
        const querySnapshot = await getDocs(q);
        
        const menuItems = [];
        querySnapshot.forEach((doc) => {
            menuItems.push(doc.data());
        });
        
        if (menuItems.length === 0) return;
        
        // Group items by category to construct dynamic cards
        const categories = {};
        menuItems.forEach(item => {
            if (!categories[item.category]) categories[item.category] = [];
            categories[item.category].push(item);
        });

        // Loop categories and render them
        const sectionMap = {
            'Quick Bites': 'quick-bites-section',
            'Veg Appetizers': 'veg-appetizers-section',
            'Non-Veg Appetizers': 'non-veg-appetizers-section',
            'Veg Curries': 'veg-curries-section',
            'Non-Veg Curries': 'non-veg-curries-section',
            'Breads': 'breads-section',
            'Indo-Chinese': 'indo-chinese-section',
            'Tandoori': 'tandoori-section',
            'Biryanis': 'biryanis-section',
            'Pulavs': 'pulavs-section',
            'Tiffins': 'tiffin-section',
            'Chaat': 'chaat-section',
            'Kids': 'kids-section',
            'Desserts': 'desserts-section',
            'Drinks': 'beverages-section'
        };

        for (const [catName, dishes] of Object.entries(categories)) {
            const sectionId = sectionMap[catName];
            if (!sectionId) continue;
            
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) continue;
            
            // Find or construct dynamic list container
            let container = targetSection.querySelector('.fluid-grid') || targetSection.querySelector('.grid') || targetSection.querySelector('.menu-grid');
            
            if (container) {
                // Prepend dynamically loaded database dishes before static fallback items
                const dynamicHtml = dishes.map(dish => `
                    <div class="bg-[#121212] rounded-3xl border border-gray-900 overflow-hidden flex flex-col justify-between hover:border-primary/20 transition duration-300" data-dish-id="${catName.toLowerCase()}-dynamic" data-veg="${dish.dietary === 'veg'}" data-search="${dish.name.toLowerCase()} ${catName.toLowerCase()}">
                        <div class="relative h-48 bg-gray-950 flex items-center justify-center overflow-hidden">
                            ${dish.imageUrl ? 
                                `<img src="${dish.imageUrl}" class="w-full h-full object-cover">` : 
                                `<i class="fas fa-bowl-food text-gray-800 text-5xl"></i>`
                            }
                            
                            <!-- Diet indicator -->
                            <span class="absolute top-4 right-4 text-[8px] font-bold tracking-wider px-2 py-0.5 rounded uppercase ${dish.dietary === 'veg' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}">
                                ${dish.dietary === 'veg' ? '🌱 Veg' : '🍖 Non-Veg'}
                            </span>
                            
                            ${dish.badge ? `<span class="absolute top-4 left-4 text-[8px] font-bold tracking-wider px-2.5 py-0.5 rounded bg-primary text-[#121212] uppercase">${dish.badge}</span>` : ''}
                        </div>
                        
                        <div class="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div class="flex items-start justify-between gap-3 mb-2">
                                    <h4 class="text-white font-bold text-sm tracking-wide font-display">${dish.name}</h4>
                                    <span class="text-primary font-bold text-sm">$${dish.price}</span>
                                </div>
                                <p class="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4">${dish.description || ''}</p>
                            </div>
                            
                            <a href="https://online.skytab.com/2d1f6d95e37f74d029fc5b1b9733c4df/order-settings" target="_blank" class="w-full bg-[#1b1b1b] border border-gray-800 hover:border-primary/50 text-gray-300 hover:text-white font-semibold py-3.5 rounded-xl transition text-center text-xs tracking-wider uppercase block">
                                Grab Yours
                            </a>
                        </div>
                    </div>
                `).join('');
                
                // Overwrite hardcoded fallback content with real dynamic data!
                container.innerHTML = dynamicHtml;
            }
        }
    } catch (err) {
        console.error("Error overlaying dynamic menu categories:", err);
    }
}

// ==========================================
// 📖 ABOUT PAGE INJECTION
// ==========================================
async function syncAboutPage(db, collectionName) {
    try {
        const heroDoc = await getDoc(doc(db, collectionName, 'about_hero'));
        if (heroDoc.exists()) {
            const data = heroDoc.data();
            const h1 = document.querySelector('#hero-section h1') || document.querySelector('h1');
            const subtitle = document.querySelector('#hero-section p') || document.querySelector('.hero-content p');
            if (h1 && data.title) h1.innerText = data.title;
            if (subtitle && data.subtitle) subtitle.innerText = data.subtitle;
        }
        
        const missionDoc = await getDoc(doc(db, collectionName, 'about_mission'));
        if (missionDoc.exists()) {
            const storyText = document.querySelector('#spice-section p') || document.querySelector('#story p');
            if (storyText && missionDoc.data().content) {
                storyText.innerText = missionDoc.data().content;
            }
        }
        
        const teamDoc = await getDoc(doc(db, collectionName, 'about_team'));
        if (teamDoc.exists()) {
            const members = teamDoc.data().members || [];
            // Rebuild team section if grid exists
            const teamGrid = document.querySelector('.about-team-grid') || document.querySelector('#team-grid') || document.querySelector('.grid');
            if (teamGrid && members.length > 0) {
                teamGrid.innerHTML = members.map(member => `
                    <div class="bg-[#121212] p-8 rounded-3xl border border-gray-900 shadow-xl flex flex-col items-center text-center hover:border-primary/20 transition duration-300">
                        <div class="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl mb-6">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <h4 class="text-white font-bold text-sm tracking-wide font-display">${member.name}</h4>
                        <span class="text-primary text-[10px] font-semibold tracking-widest uppercase mt-1 block">${member.role}</span>
                        <p class="text-gray-400 text-xs leading-relaxed mt-4">"${member.bio || ''}"</p>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.error("Error overlaying about heritage page:", err);
    }
}

// ==========================================
// 📸 GALLERY IMAGES SYNC
// ==========================================
async function syncGalleryPage(db) {
    try {
        const galleryRef = collection(db, 'gallery_items');
        const q = query(galleryRef, where('visible', '!=', false));
        const querySnapshot = await getDocs(q);
        
        const photos = [];
        querySnapshot.forEach((doc) => {
            photos.push(doc.data());
        });
        
        if (photos.length === 0) return;
        
        // Find main category containers
        const foodAtmosphereGrid = document.querySelector('#food-atmosphere-grid') || document.getElementById('food-atmosphere-section') || document.querySelector('.gallery-grid');
        const specialsPromoGrid = document.querySelector('#specials-promotional-grid') || document.getElementById('specials-promotions-section');
        
        if (foodAtmosphereGrid) {
            const foodPhotos = photos.filter(p => p.category === 'Food & Atmosphere');
            if (foodPhotos.length > 0) {
                const html = foodPhotos.map(photo => `
                    <div class="relative overflow-hidden rounded-3xl border border-gray-900 group aspect-square hover:border-primary/20 transition-all duration-300 cursor-pointer" onclick="openLightbox('${photo.imageUrl}')">
                        <img src="${photo.imageUrl}" class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition duration-300">
                            <span class="text-xs text-primary font-bold tracking-widest uppercase">Food & Atmosphere</span>
                            <h4 class="text-white text-xs font-semibold tracking-wide mt-1">${photo.caption || ''}</h4>
                        </div>
                    </div>
                `).join('');
                
                foodAtmosphereGrid.insertAdjacentHTML('afterbegin', html);
            }
        }
        
        if (specialsPromoGrid) {
            const promoPhotos = photos.filter(p => p.category === 'Specials & Promotions');
            if (promoPhotos.length > 0) {
                const html = promoPhotos.map(photo => `
                    <div class="relative overflow-hidden rounded-3xl border border-gray-900 group hover:border-primary/20 transition-all duration-300 cursor-pointer break-inside-avoid mb-6" onclick="openLightbox('${photo.imageUrl}')">
                        <img src="${photo.imageUrl}" class="w-full h-auto object-cover transition-all duration-500 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition duration-300">
                            <span class="text-xs text-primary font-bold tracking-widest uppercase">Specials & Promo</span>
                            <h4 class="text-white text-xs font-semibold tracking-wide mt-1">${photo.caption || ''}</h4>
                        </div>
                    </div>
                `).join('');
                
                specialsPromoGrid.insertAdjacentHTML('afterbegin', html);
            }
        }
    } catch (err) {
        console.error("Error overlaying media gallery page:", err);
    }
}

// ==========================================
// 📞 CONTACT DETAILS INJECTION
// ==========================================
async function syncContactPage(db, collectionName) {
    try {
        const contactDoc = await getDoc(doc(db, collectionName, 'contact_info'));
        if (contactDoc.exists()) {
            const data = contactDoc.data();
            
            // Address details
            const addressCard = document.querySelector('#contact-location p, .contact-details address');
            if (addressCard && data.street) {
                addressCard.innerHTML = `<i class="fas fa-map-marker-alt text-primary mr-2"></i> ${data.street},<br>${data.city || ''}, ${data.state || ''} ${data.zip || ''}`;
            }
            
            // Phone info
            const phoneWrap = document.querySelector('#contact-location a[href^="tel:"], .contact-phone');
            if (phoneWrap && data.phone1) {
                phoneWrap.href = `tel:${data.phone1}`;
                phoneWrap.innerHTML = `<i class="fas fa-phone-alt text-primary mr-2"></i> ${data.phone1}`;
            }
            
            // Email info
            const emailWrap = document.querySelector('a[href^="mailto:"]');
            if (emailWrap && data.email) {
                emailWrap.href = `mailto:${data.email}`;
                emailWrap.innerHTML = `<i class="fas fa-envelope text-primary mr-2"></i> ${data.email}`;
            }
            
            // Opening Hours details
            const hoursWrap = document.querySelector('#contact-location .hours, .contact-hours');
            if (hoursWrap && data.hours) {
                hoursWrap.innerHTML = `<i class="fas fa-clock text-primary mr-2"></i> ${data.hours.replace(/\n/g, '<br>')}`;
            }
        }
    } catch (err) {
        console.error("Error overlaying contact timing details:", err);
    }
}

// ==========================================
// ⚙️ GLOBAL BRANDING, FOOTER & SEO METADATA
// ==========================================
async function syncBrandingAndSEO(db, collectionName) {
    try {
        // Footer syncing
        const footerDoc = await getDoc(doc(db, collectionName, 'footer'));
        if (footerDoc.exists()) {
            const desc = footerDoc.data().description;
            const footerPara = document.querySelector('footer p');
            if (footerPara && desc) {
                footerPara.innerText = desc;
            }
        }
        
        // Social icons linking
        const socialDoc = await getDoc(doc(db, collectionName, 'social_links'));
        if (socialDoc.exists()) {
            const links = socialDoc.data();
            const instLink = document.querySelectorAll('a[href*="instagram.com"]');
            const fbLink = document.querySelectorAll('a[href*="facebook.com"]');
            const ytLink = document.querySelectorAll('a[href*="youtube.com"]');
            
            if (links.instagram) instLink.forEach(el => el.href = links.instagram);
            if (links.facebook) fbLink.forEach(el => el.href = links.facebook);
            if (links.youtube) ytLink.forEach(el => el.href = links.youtube);
        }
        
        // SEO Page Title updates
        const seoDoc = await getDoc(doc(db, collectionName, 'seo_meta'));
        if (seoDoc.exists() && seoDoc.data().title) {
            const baseTitle = document.title.split('|').pop().trim();
            document.title = `${seoDoc.data().title} | ${baseTitle}`;
            
            // Update meta tag details
            const descMeta = document.querySelector('meta[name="description"]');
            if (descMeta && seoDoc.data().description) {
                descMeta.setAttribute('content', seoDoc.data().description);
            }
        }
    } catch (err) {
        console.error("Error synchronizing branding elements:", err);
    }
}

// Helper: resolve icon codes
function getIconClass(key) {
    const iconMap = {
        sun: 'sun',
        fire: 'fire',
        star: 'star',
        gift: 'gift',
        percent: 'percent',
        bolt: 'bolt'
    };
    return iconMap[key] || 'sun';
}
