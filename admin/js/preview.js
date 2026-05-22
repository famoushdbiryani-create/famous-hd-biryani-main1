// admin/js/preview.js
// Handles the Live Preview modal and device view switching

window.saveAndPreview = async function(pageName) {
    if (window.showLoading) window.showLoading();
    
    try {
        // Trigger save draft before preview depending on active editor section
        let saveAction = Promise.resolve();
        
        if (typeof window.saveHomeContentDraft === 'function' && document.getElementById('section-home') && !document.getElementById('section-home').classList.contains('hidden')) {
            saveAction = window.saveHomeContentDraft();
        } else if (typeof window.saveAboutContentDraft === 'function' && document.getElementById('section-about') && !document.getElementById('section-about').classList.contains('hidden')) {
            saveAction = window.saveAboutContentDraft();
        } else if (typeof window.saveContactContentDraft === 'function' && document.getElementById('section-contact') && !document.getElementById('section-contact').classList.contains('hidden')) {
            saveAction = window.saveContactContentDraft();
        }
        
        await saveAction;
        
        // Open the preview page with ?preview=true parameter
        // If preview=true, firebase-data-sync.js reads from 'preview_content' instead of 'site_content'
        const previewUrl = `../${pageName}?preview=true&t=${Date.now()}`;
        window.openPreview(previewUrl);
    } catch (err) {
        console.error("Preview preparation failed:", err);
        if (window.showToast) window.showToast("Could not prepare draft preview. Check console.", "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

window.openPreview = function(pageUrl) {
    const modal = document.getElementById('preview-modal');
    const iframe = document.getElementById('preview-iframe');
    
    if (modal && iframe) {
        iframe.src = pageUrl;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Lock background scrolling
        
        // Default to desktop view
        window.switchPreviewDevice('desktop');
    }
};

window.closePreview = function() {
    const modal = document.getElementById('preview-modal');
    const iframe = document.getElementById('preview-iframe');
    
    if (modal && iframe) {
        iframe.src = ''; // Unload page
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Unlock body scroll
    }
};

window.switchPreviewDevice = function(device) {
    const wrapper = document.getElementById('preview-iframe-wrapper');
    const btnDesktop = document.getElementById('btn-device-desktop');
    const btnTablet = document.getElementById('btn-device-tablet');
    const btnMobile = document.getElementById('btn-device-mobile');
    
    if (!wrapper) return;
    
    // Remove active styles from all device buttons
    [btnDesktop, btnTablet, btnMobile].forEach(btn => {
        if (btn) {
            btn.classList.remove('bg-primary/10', 'text-primary');
            btn.classList.add('text-gray-500', 'hover:text-white');
        }
    });
    
    // Set widths & button styling based on selection
    if (device === 'desktop') {
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '100%';
        if (btnDesktop) {
            btnDesktop.classList.add('bg-primary/10', 'text-primary');
            btnDesktop.classList.remove('text-gray-500', 'hover:text-white');
        }
    } else if (device === 'tablet') {
        wrapper.style.width = '768px';
        wrapper.style.maxWidth = 'calc(100% - 20px)';
        if (btnTablet) {
            btnTablet.classList.add('bg-primary/10', 'text-primary');
            btnTablet.classList.remove('text-gray-500', 'hover:text-white');
        }
    } else if (device === 'mobile') {
        wrapper.style.width = '375px';
        wrapper.style.maxWidth = 'calc(100% - 20px)';
        if (btnMobile) {
            btnMobile.classList.add('bg-primary/10', 'text-primary');
            btnMobile.classList.remove('text-gray-500', 'hover:text-white');
        }
    }
};

// Pressing Escape closes the preview
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('preview-modal');
        if (modal && !modal.classList.contains('hidden')) {
            window.closePreview();
        }
    }
});
