# 🔒 Website Lock Point: v1.0-perf-social
**Created on:** 2026-05-01 13:08 PM

This document confirms that the website has been locked in its current stable state. If any future changes cause issues, we can revert to this exact version.

### **What is included in this Lock Point:**
1.  **Social Media Integration**:
    *   Full set of 5 icons in the footer (YouTube, Instagram, Threads, Facebook, X).
    *   All icons linked to official `@famoushd_biryani` profiles.
    *   Upgraded Font Awesome 6.5.1 for brand icon support.
2.  **Performance Optimization**:
    *   Preconnect & DNS-prefetch hints added for faster loading on Cloudflare.
    *   `fetchpriority="high"` and `decoding="async"` applied to critical hero images.
    *   Site-wide `loading="lazy"` for all non-essential images.
3.  **UI Refinements**:
    *   Halal logo size optimized for mobile.
    *   Gallery "View More Moments" hidden section implementation.
    *   Night/Dark mode fixes for consistency across all sections.

### **How to Revert to this Point:**
To undo all future changes and return to this moment, I will simply run:
`git checkout stable-v1.0-perf-social`

---
*This version is safely backed up in the `.backups/stable-v1.0/` folder.*
