(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();document.addEventListener("error",function(e){if(e.target.tagName.toLowerCase()==="img"){if(e.target.dataset.fallbackApplied)return;e.target.dataset.fallbackApplied="true",e.target.src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";const t=e.target.closest("picture");t&&t.querySelectorAll("source").forEach(o=>o.remove())}},!0);const E=1024,T=110,k=[{label:"Quick Bites",count:8,href:"./menu.html#quick-bites-section"},{label:"Veg Appetizers",count:14,href:"./menu.html#veg-appetizers-section"},{label:"Non-Veg Appetizers",count:17,href:"./menu.html#non-veg-appetizers-section"},{label:"Vegetarian Curries",count:14,href:"./menu.html#veg-curries-section"},{label:"Non-Veg Curries",count:17,href:"./menu.html#non-veg-curries-section"},{label:"Breads / Naan / Roti",count:19,href:"./menu.html#breads-section"},{label:"Indo-Chinese",count:6,href:"./menu.html#indo-chinese-section"},{label:"Tandoori / Kebabs",count:12,href:"./menu.html#tandoori-section"},{label:"Regular Biryanis",count:18,href:"./menu.html#biryanis-section"},{label:"Pulavs",count:17,href:"./menu.html#pulavs-section"},{label:"Tiffin Specials",count:24,href:"./menu.html#tiffin-section"},{label:"Chaat / Street Snacks",count:8,href:"./menu.html#chaat-section"},{label:"Kids Menu",count:6,href:"./menu.html#kids-section"},{label:"Desserts",count:4,href:"./menu.html#desserts-section"},{label:"Beverages",count:13,href:"./menu.html#beverages-section"}],w=()=>window.innerWidth>=E?"full":"compact",x=()=>k.map(({label:e,count:t,href:a})=>`
          <a href="${a}" class="pp-menu-category-link">
            <span class="pp-menu-category-label">${e}</span>
            <span class="pp-menu-category-count">(${t})</span>
          </a>`).join(""),M=e=>`
  <nav
    class="premium-header-nav"
    aria-label="Primary"
    data-header-mode="${e}"
    data-header-ready="true"
    data-menu-panel-open="false"
  >
    <div class="premium-header-inner">
      <div class="premium-header-shell">
        <div class="premium-header-left">
          <a href="./" class="pp-brand-link" aria-label="Famous HD Biryani home">
            <img
              src="./left-fhd-logo.png"
              alt="Famous HD Biryani"
              class="pp-logo-img dark:brightness-110"
            />
          </a>

          <div class="pp-left-nav">
            <a href="./" class="nav-link pp-nav-text" data-nav-key="home">HOME</a>
            <a
              href="./menu.html"
              class="nav-link pp-nav-text pp-menu-trigger"
              data-nav-key="menu"
              data-menu-trigger
              aria-haspopup="true"
              aria-expanded="false"
            >
              MENU
            </a>
            <a href="./about.html" class="nav-link pp-nav-text" data-nav-key="about">ABOUT US</a>
            <a href="./gallery.html" class="nav-link pp-nav-text" data-nav-key="gallery">GALLERY</a>
          </div>
        </div>

        <div class="pp-hd-logo-zone">
          <a href="./" class="pp-hd-logo-link" aria-label="Famous HD Biryani home">
            <img
              src="./center-hd-logo.png"
              alt="Famous HD Biryani HD logo"
              class="pp-hd-logo-img"
            />
          </a>
        </div>

        <div class="premium-header-right">
          <div class="pp-right-nav">
            <a href="/#contact" class="nav-link pp-nav-text" data-nav-key="contact">CONTACT</a>
            <a href="/#location" class="nav-link pp-nav-text" data-nav-key="location">LOCATION</a>
          </div>

          <div class="premium-header-actions">
            <button
              id="theme-toggle"
              class="pp-theme-toggle"
              type="button"
              aria-label="Switch to night mode"
            >
              <span class="pp-theme-toggle-icon" aria-hidden="true">
                <i class="fa-solid fa-moon"></i>
              </span>
            </button>

            <a href="./menu.html" class="header-order-btn pp-order-online-btn" aria-label="Order online">
              <span>ORDER ONLINE</span>
            </a>
          </div>

          <button
            id="mobile-menu-btn"
            class="pp-hamburger"
            type="button"
            aria-controls="premium-menu-container"
            aria-expanded="false"
            aria-label="Open navigation menu"
            aria-hidden="${e==="full"?"true":"false"}"
          >
            <span class="pp-hamburger-lines" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="pp-menu-panel-layer" data-menu-panel aria-hidden="true">
    <div class="pp-menu-panel-shell">
      <div class="pp-menu-panel-surface">
        <div class="pp-menu-panel-grid">
${x()}
        </div>
      </div>
    </div>
  </div>

  <div id="menu-overlay" aria-hidden="true"></div>
  <div id="premium-menu-container" aria-hidden="true">
    <div id="menu-layer-1" aria-hidden="true" class="menu-anim-layer"></div>
    <div id="menu-layer-2" aria-hidden="true" class="menu-anim-layer"></div>
    <div id="menu-layer-3" aria-hidden="true" class="menu-anim-layer"></div>
    <div id="premium-menu-content" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title">
      <h2 id="mobile-navigation-title" class="mobile-menu-sr-only">Navigation</h2>

      <button id="mobile-menu-close" class="mobile-menu-close" type="button" aria-label="Close navigation menu">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      <div class="mobile-menu-body">
        <nav class="premium-mobile-nav">
          <a href="./" class="premium-nav-link" data-nav-key="home">HOME</a>
          <a href="./menu.html" class="premium-nav-link" data-nav-key="menu">MENU</a>
          <a href="./about.html" class="premium-nav-link" data-nav-key="about">ABOUT US</a>
          <a href="./gallery.html" class="premium-nav-link" data-nav-key="gallery">GALLERY</a>
          <a href="/#contact" class="premium-nav-link" data-nav-key="contact">CONTACT</a>
          <a href="/#location" class="premium-nav-link" data-nav-key="location">LOCATION</a>
        </nav>

        <button
          id="mobile-theme-toggle"
          class="mobile-menu-theme-row"
          type="button"
          aria-label="Switch to night mode"
        >
          <span class="mobile-menu-theme-text">DAY / NIGHT</span>
          <span class="mobile-menu-theme-pill">
            <span class="mobile-menu-theme-knob">
              <i class="fa-solid fa-moon" data-theme-icon aria-hidden="true"></i>
            </span>
            <span class="mobile-menu-theme-value" data-theme-value>NIGHT</span>
          </span>
        </button>

        <div class="mobile-menu-order">
          <a href="./menu.html" class="mobile-menu-order-btn">
            ORDER ONLINE
          </a>
        </div>
      </div>
    </div>
  </div>
`,B=e=>{const t=w();e.innerHTML=M(t);const a=e.querySelector(".premium-header-nav"),o=e.querySelector("#mobile-menu-btn"),n=e.querySelector("[data-menu-trigger]"),i=e.querySelector("[data-menu-panel]");if(!(a instanceof HTMLElement)||!(o instanceof HTMLElement)||!(n instanceof HTMLElement)||!(i instanceof HTMLElement))return;const s=window.matchMedia(`(min-width: ${E}px)`);let c=0;const p=r=>{document.dispatchEvent(new CustomEvent("header:modechange",{detail:{mode:r}}))},d=r=>{const m=a.dataset.headerMode==="full"&&r;a.dataset.menuPanelOpen=m?"true":"false",i.setAttribute("aria-hidden",m?"false":"true"),n.setAttribute("aria-expanded",m?"true":"false")},g=()=>{c!==0&&(window.clearTimeout(c),c=0)},v=()=>{g(),c=window.setTimeout(()=>{d(!1),c=0},T)},f=()=>{a.dataset.headerMode==="full"&&(g(),d(!0))},h=(r,{emit:m=!0}={})=>{const A=a.dataset.headerMode;a.dataset.headerMode=r,o.setAttribute("aria-hidden",r==="full"?"true":"false"),r!=="full"&&d(!1),m&&A!==r&&p(r)},l=({emit:r=!0}={})=>{h(s.matches?"full":"compact",{emit:r})},u=()=>{window.setTimeout(()=>{const r=document.activeElement;r instanceof Node&&(n.contains(r)||i.contains(r))||d(!1)},0)};n.addEventListener("mouseenter",f),n.addEventListener("mouseleave",v),n.addEventListener("focus",f),n.addEventListener("blur",u),i.addEventListener("mouseenter",f),i.addEventListener("mouseleave",v),i.addEventListener("focusin",f),i.addEventListener("focusout",u),document.addEventListener("keydown",r=>{r.key==="Escape"&&d(!1)}),window.addEventListener("scroll",()=>{a.dataset.menuPanelOpen==="true"&&d(!1)},{passive:!0}),"addEventListener"in s?s.addEventListener("change",()=>l()):"addListener"in s&&s.addListener(()=>l()),l({emit:!1})};document.querySelectorAll("[data-site-header-root]").forEach(e=>{B(e)});const S={"#quick-bites-section":{selector:"#quick-bites-section"},"#veg-appetizers-section":{selector:"#veg-appetizers-section"},"#non-veg-appetizers-section":{selector:"#non-veg-appetizers-section",forceAllMenu:!0},"#biryanis-section":{selector:"#biryanis-section"},"#pulavs-section":{selector:"#pulavs-section"},"#breads-section":{selector:"#breads-section"},"#desserts-section":{selector:"#desserts-section"},"#beverages-section":{selector:"#beverages-section"},"#hd-menu-biryani-veg":{selector:'[data-dish-id="biryanis-item-0"]'},"#hd-menu-biryani-chicken":{selector:'[data-dish-id="biryanis-item-6"]',forceAllMenu:!0},"#hd-menu-biryani-mutton":{selector:'[data-dish-id="biryanis-item-14"]',forceAllMenu:!0},"#hd-menu-fried-rice":{selector:'[data-dish-id="indo-chinese-item-0"]'}},O=()=>{let e=window.location.pathname.toLowerCase();e=e.replace(/\/$/,"");const t=window.location.hash||"";return e===""||e==="/"||e==="/index.html"||e.includes("index")?t==="#contact"?"contact":t==="#location"||t==="#contact-location"?"location":"home":e.includes("/menu")?"menu":e.includes("/about")?"about":e.includes("/gallery")?"gallery":"home"},L=()=>{const e=O();document.querySelectorAll("[data-nav-key]").forEach(a=>{const o=e!==null&&a.dataset.navKey===e;a.classList.toggle("is-active",o),o?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current")})},H=e=>{const t=document.getElementById("menu-search"),a=document.getElementById("veg-only-filter");t instanceof HTMLInputElement&&t.value!==""&&(t.value="",t.dispatchEvent(new Event("input",{bubbles:!0}))),e&&a instanceof HTMLInputElement&&a.checked&&(a.checked=!1,a.dispatchEvent(new Event("change",{bubbles:!0})))},b=()=>{const e=decodeURIComponent(window.location.hash||""),t=S[e];if(!t)return;const a=()=>{const o=document.querySelector(t.selector);o instanceof HTMLElement&&(H(!!t.forceAllMenu),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{const n=document.querySelector(".premium-header-nav"),i=document.getElementById("menu-filter-controls"),s=n instanceof HTMLElement?n.offsetHeight:90,c=i instanceof HTMLElement?i.offsetHeight:0,p=o.getBoundingClientRect().top+window.scrollY-s-c-18;window.scrollTo({top:Math.max(0,p),behavior:"smooth"})})}))};window.setTimeout(a,60)},I=e=>{document.querySelectorAll("[data-nav-key]").forEach(t=>{const a=t.dataset.navKey===e;t.classList.toggle("is-active",a),a?t.setAttribute("aria-current","page"):t.removeAttribute("aria-current")})},C=()=>{document.querySelectorAll("[data-nav-key]").forEach(e=>{e.addEventListener("click",()=>{I(e.dataset.navKey)})})},y=()=>{L(),b(),C()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",y):y();window.addEventListener("hashchange",()=>{L(),b()});window.addEventListener("load",b);document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("mobile-menu-btn"),t=document.getElementById("premium-menu-container"),a=document.getElementById("menu-overlay"),o=document.getElementById("mobile-menu-close"),n=document.querySelector(".premium-header-nav");if(!e||!t||!a||!o)return;let i=null;const s=()=>n?.dataset.headerMode==="compact",c=["a[href]","button:not([disabled])","[tabindex]:not([tabindex='-1'])"].join(","),p=()=>Array.from(t.querySelectorAll(c)).filter(l=>!l.hasAttribute("disabled")&&l.offsetParent!==null);let d,g;const v=()=>{clearTimeout(d),clearTimeout(g)},f=()=>{s()&&(v(),i=document.activeElement instanceof HTMLElement?document.activeElement:e,t.classList.add("is-wiping"),t.classList.add("active"),a.classList.add("active"),document.body.classList.add("menu-open"),e.setAttribute("aria-expanded","true"),t.setAttribute("aria-hidden","false"),a.setAttribute("aria-hidden","false"),window.requestAnimationFrame(()=>{o.focus()}))},h=({restoreFocus:l=!0}={})=>{v(),t.classList.remove("active"),t.classList.remove("is-wiping"),t.setAttribute("aria-hidden","true"),d=setTimeout(()=>{if(a.classList.remove("active"),document.body.classList.remove("menu-open"),e.setAttribute("aria-expanded","false"),a.setAttribute("aria-hidden","true"),l){const u=i instanceof HTMLElement?i:e;window.requestAnimationFrame(()=>{u.focus()})}},450)};e.addEventListener("click",()=>{if(s()){if(t.classList.contains("active")){h();return}f()}}),o.addEventListener("click",h),a.addEventListener("click",()=>h()),document.querySelectorAll("#premium-menu-content .premium-nav-link, #premium-menu-content .mobile-menu-order-btn").forEach(l=>{l.addEventListener("click",()=>{t.classList.contains("active")&&h()})}),document.addEventListener("keydown",l=>{if(!t.classList.contains("active"))return;if(l.key==="Escape"){h();return}if(l.key!=="Tab")return;const u=p();if(u.length===0)return;const r=u[0],m=u[u.length-1];if(l.shiftKey&&document.activeElement===r){l.preventDefault(),m.focus();return}!l.shiftKey&&document.activeElement===m&&(l.preventDefault(),r.focus())}),document.addEventListener("header:modechange",l=>{l.detail?.mode!=="compact"&&t.classList.contains("active")&&h({restoreFocus:!1})})});document.addEventListener("DOMContentLoaded",()=>{const e=[document.getElementById("theme-toggle"),document.getElementById("mobile-theme-toggle")].filter(Boolean),t=o=>{const n=o==="dark";document.body.classList.toggle("light-theme",!n),document.body.classList.toggle("dark-theme",n),document.documentElement.classList.toggle("dark",n);const i=document.getElementById("theme-toggle");i&&(i.classList.toggle("is-dark",n),i.setAttribute("aria-label",n?"Switch to day mode":"Switch to night mode"),i.innerHTML=`
        <span class="pp-theme-toggle-icon" aria-hidden="true">
          <i class="fa-solid fa-${n?"sun":"moon"}"></i>
        </span>
      `);const s=document.getElementById("mobile-theme-toggle");if(s){s.classList.toggle("is-dark",n),s.setAttribute("aria-label",n?"Switch to day mode":"Switch to night mode");const c=s.querySelector("[data-theme-value]");c&&(c.textContent=n?"DAY":"NIGHT");const p=s.querySelector("[data-theme-icon]");p&&(p.className=`fa-solid fa-${n?"sun":"moon"}`)}},a=localStorage.getItem("theme")||"light";t(a),e.forEach(o=>{o.addEventListener("click",()=>{const n=document.body.classList.contains("dark-theme")?"light":"dark";t(n),localStorage.setItem("theme",n)})})});(function(){const e=document.createElement("button");e.id="scrollToTopBtn",e.innerHTML='<i class="fas fa-chevron-up"></i>',e.setAttribute("aria-label","Scroll to top");const t=document.createElement("style");t.innerHTML=`
        #scrollToTopBtn {
            position: fixed;
            z-index: 9998;
            border-radius: 50%;
            background: #d1b132;
            color: #380403;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(209, 177, 50, 0.35);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease, background 0.2s ease;
            transform: translateY(10px);
            -webkit-tap-highlight-color: transparent;
        }

        /* Desktop (default) */
        #scrollToTopBtn {
            width: 48px;
            height: 48px;
            font-size: 18px;
            bottom: 40px;
            right: 40px;
        }

        /* Laptop */
        @media (max-width: 1279px) {
            #scrollToTopBtn {
                width: 44px;
                height: 44px;
                font-size: 17px;
                bottom: 40px;
                right: 40px;
            }
        }

        /* Tablet */
        @media (max-width: 1023px) {
            #scrollToTopBtn {
                width: 40px;
                height: 40px;
                font-size: 16px;
                bottom: 30px;
                right: 30px;
            }
        }

        /* Mobile */
        @media (max-width: 767px) {
            #scrollToTopBtn {
                width: 36px;
                height: 36px;
                font-size: 14px;
                bottom: 25px;
                right: 20px;
            }
        }

        /* Small mobile */
        @media (max-width: 480px) {
            #scrollToTopBtn {
                width: 34px;
                height: 34px;
                font-size: 13px;
                bottom: 25px;
                right: 20px;
            }
        }

        /* Mobile: move above fixed order bar */
        @media (max-width: 900px) {
            #scrollToTopBtn {
                bottom: 90px !important;
            }
        }

        /* Desktop hover effect */
        @media (hover: hover) {
            #scrollToTopBtn:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(209, 177, 50, 0.5);
                background: #bfa02c;
            }
        }

        /* Mobile tap effect */
        #scrollToTopBtn:active {
            transform: scale(0.95) !important;
            transition-duration: 0.15s;
        }

        #scrollToTopBtn.is-visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }
    `,document.head.appendChild(t),document.body.appendChild(e);let a=!1;window.addEventListener("scroll",function(){a||(requestAnimationFrame(function(){window.scrollY>400?e.classList.add("is-visible"):e.classList.remove("is-visible"),a=!1}),a=!0)},{passive:!0}),e.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})})})();
