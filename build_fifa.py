import re
import os

html_template = """
    <!-- Hero Section -->
    <section class="menu-hero-section relative pb-12 flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 z-0 bg-black">
            <img alt="FIFA World Cup Special Menu Background" class="w-full h-full object-cover opacity-50"
                src="https://images.unsplash.com/photo-1518091043644-c1d44570a2c9?q=80&w=2000&auto=format&fit=crop"
                 width="1376" height="768" decoding="async" loading="eager" fetchpriority="high" />
            <div class="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-transparent to-black/60"></div>
        </div>
        <div class="menu-halal-stamp-container">
            <img alt="100% Halal Certified Indian Food McKinney" class="menu-halal-stamp" src="/assets/halal-CcoUxlhx.webp" width="600" height="600" decoding="async" loading="eager" />
        </div>
        <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
            <div class="mb-4 inline-block">
                <span class="text-primary font-display italic text-lg md:text-2xl tracking-widest uppercase border-b border-primary pb-1">LIMITED TIME ONLY</span>
            </div>
            <h1 class="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight drop-shadow-xl translate-y-4 opacity-0 animate-[fadeSlideUp_1s_ease-out_forwards]">
                FIFA World Cup <br /> <span class="gold-gradient-text">Special Menu</span>
            </h1>
            <p class="text-gray-200 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto font-body translate-y-4 opacity-0 animate-[fadeSlideUp_1s_ease-out_0.2s_forwards]">
                Celebrate the beautiful game with our exclusive lineup of bold flavors, fan-favorite combos, and game-winning signature dishes.
            </p>
        </div>
    </section>

    <!-- Category Icon Navigation Bar -->
    <div id="menu-category-bar" class="sticky z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-md border-b border-primary/20 py-1 transition-all duration-500">
        <div class="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 relative">
            <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background-light dark:from-background-dark to-transparent z-10 lg:hidden pointer-events-none"></div>
            <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent z-10 lg:hidden pointer-events-none"></div>

            <div class="flex items-center justify-between">
                <button id="scroll-cat-left" class="flex w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm items-center justify-center text-primary hover:bg-primary hover:text-white transition z-20 shrink-0">
                    <i class="fas fa-chevron-left text-xs"></i>
                </button>
                <div id="category-container" class="flex overflow-x-auto no-scrollbar py-1 w-full snap-x scroll-smooth justify-start md:justify-center">

                    <button data-target="kickoff-starters-section" class="category-tab shrink-0 flex flex-col items-center justify-center py-2 px-4 mx-1 md:mx-4 min-w-[80px] md:min-w-[120px] transition-all duration-300 relative group text-primary border-b-2 border-primary">
                        <i class="fas fa-futbol text-xl md:text-3xl mb-1 group-hover:scale-110 transition-transform cat-icon-lg"></i>
                        <span class="text-[13px] md:text-sm font-bold tracking-tight uppercase whitespace-nowrap cat-label">Kickoff Starters</span>
                    </button>

                    <button data-target="fan-favorites-section" class="category-tab shrink-0 flex flex-col items-center justify-center py-2 px-4 mx-1 md:mx-4 min-w-[80px] md:min-w-[120px] transition-all duration-300 relative group text-gray-500 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-300">
                        <i class="fas fa-star text-xl md:text-3xl mb-1 group-hover:scale-110 transition-transform cat-icon-lg"></i>
                        <span class="text-[13px] md:text-sm font-bold tracking-tight uppercase whitespace-nowrap cat-label">Fan Favorites</span>
                    </button>
                    
                    <button data-target="veg-options-section" class="category-tab shrink-0 flex flex-col items-center justify-center py-2 px-4 mx-1 md:mx-4 min-w-[80px] md:min-w-[120px] transition-all duration-300 relative group text-gray-500 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-300">
                        <i class="fas fa-leaf text-xl md:text-3xl mb-1 group-hover:scale-110 transition-transform cat-icon-lg"></i>
                        <span class="text-[13px] md:text-sm font-bold tracking-tight uppercase whitespace-nowrap cat-label">Veg Options</span>
                    </button>

                    <button data-target="rice-bowls-section" class="category-tab shrink-0 flex flex-col items-center justify-center py-2 px-4 mx-1 md:mx-4 min-w-[80px] md:min-w-[120px] transition-all duration-300 relative group text-gray-500 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-300">
                        <i class="fas fa-bowl-rice text-xl md:text-3xl mb-1 group-hover:scale-110 transition-transform cat-icon-lg"></i>
                        <span class="text-[13px] md:text-sm font-bold tracking-tight uppercase whitespace-nowrap cat-label">Rice Bowls & Biryani</span>
                    </button>

                    <button data-target="combo-deals-section" class="category-tab shrink-0 flex flex-col items-center justify-center py-2 px-4 mx-1 md:mx-4 min-w-[80px] md:min-w-[120px] transition-all duration-300 relative group text-gray-500 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-300">
                        <i class="fas fa-people-group text-xl md:text-3xl mb-1 group-hover:scale-110 transition-transform cat-icon-lg"></i>
                        <span class="text-[13px] md:text-sm font-bold tracking-tight uppercase whitespace-nowrap cat-label">Combo Deals</span>
                    </button>

                </div>
                <button id="scroll-cat-right" class="flex w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm items-center justify-center text-primary hover:bg-primary hover:text-white transition z-20 shrink-0">
                    <i class="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- MAIN MENU CONTENT -->
    <main class="py-12 bg-background-light dark:bg-background-dark min-h-screen">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24" id="menu-container">
            
            {CATEGORIES}

        </div>
    </main>

"""

category_html = """
            <div id="{id}" class="menu-category pt-[100px] -mt-[100px]">
                <div class="flex items-center gap-4 mb-10">
                    <div class="h-[2px] flex-grow bg-gradient-to-r from-transparent to-primary/50"></div>
                    <h2 class="font-display text-4xl font-bold text-center capitalize">{title}</h2>
                    <div class="h-[2px] flex-grow bg-gradient-to-l from-transparent to-primary/50"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-10">
                    {ITEMS}
                </div>
            </div>
"""

item_html = """
                    <div class="menu-item-card group relative flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                        <div class="flex-grow flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-start mb-2 gap-4">
                                    <h3 class="font-display text-xl font-bold text-gray-900 dark:text-gray-100 dish-name leading-tight">{name}</h3>
                                    <span class="font-bold text-primary text-xl whitespace-nowrap dish-price">{price}</span>
                                </div>
                                <p class="text-gray-600 dark:text-gray-400 text-sm dish-desc leading-relaxed mb-4">{desc}</p>
                                <div class="flex flex-wrap items-center gap-2 mb-4">
                                    {badges}
                                </div>
                            </div>
                            <div>
                                <a href="https://online.skytab.com/2d1f6d95e37f74d029fc5b1b9733c4df/order-settings" rel="noopener noreferrer" target="_blank" class="grab-yours-btn inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-white transition-colors w-full md:w-auto">
                                    <i class="fas fa-shopping-bag mr-2"></i> Order Now
                                </a>
                            </div>
                        </div>
                    </div>
"""

menu_data = [
    {
        "id": "kickoff-starters-section",
        "title": "🐔 Chicken Kickoff Starters",
        "items": [
            {"name": "World Cup Chicken Wings (6 pcs)", "price": "$8.99", "desc": "Choice of Buffalo, BBQ, Peri-Peri, or Garlic Parmesan.", "type": "NON-VEG"},
            {"name": "Crispy Chicken Strips Basket", "price": "$9.99", "desc": "Fries + ranch.", "type": "NON-VEG"},
            {"name": "Nashville Hot Chicken Bites", "price": "$9.99", "desc": "Spicy crispy chicken pieces.", "type": "NON-VEG"},
            {"name": "Popcorn Chicken Bucket", "price": "$8.99", "desc": "Tossed in masala seasoning.", "type": "NON-VEG"},
            {"name": "Chicken 65 World Cup Edition", "price": "$10.99", "desc": "Indian favorite, quick fry.", "type": "NON-VEG"},
            {"name": "Honey Garlic Chicken Bites", "price": "$10.99", "desc": "Sweet and savory.", "type": "NON-VEG"},
            {"name": "Korean Sweet Chili Chicken", "price": "$11.99", "desc": "Sticky Korean-style sauce.", "type": "NON-VEG"},
            {"name": "Dragon Chicken", "price": "$11.99", "desc": "Crispy chicken, spicy dragon sauce, peppers and onions.", "type": "NON-VEG"},
        ]
    },
    {
        "id": "fan-favorites-section",
        "title": "🍔 FIFA Fan Favorites",
        "items": [
            {"name": "Crispy Chicken Burger", "price": "$9.99", "desc": "Lettuce, tomato, mayo.", "type": "NON-VEG"},
            {"name": "Spicy Chicken Burger", "price": "$10.99", "desc": "Nashville-style sauce, lettuce, tomato, mayo.", "type": "NON-VEG"},
            {"name": "Chicken Wrap", "price": "$9.99", "desc": "Crispy chicken, veggies, garlic sauce.", "type": "NON-VEG"},
            {"name": "Chicken Loaded Fries", "price": "$10.99", "desc": "Fries topped with crispy chicken and cheese sauce.", "type": "NON-VEG"},
            {"name": "Chicken Quesadilla", "price": "$10.99", "desc": "Easy and fast selling.", "type": "NON-VEG"},
            {"name": "Chicken Nachos Supreme", "price": "$11.99", "desc": "Crispy tortilla, chicken, melted cheese, fresh toppings, sauce.", "type": "NON-VEG"},
        ]
    },
    {
        "id": "veg-options-section",
        "title": "🌱 Vegetarian Options",
        "items": [
            {"name": "Crispy Paneer Bites", "price": "$8.99", "desc": "Tossed in peri-peri seasoning.", "type": "VEG"},
            {"name": "Loaded Masala Fries", "price": "$6.99", "desc": "Cheese sauce + seasoning.", "type": "VEG"},
            {"name": "Veg Spring Rolls (6 pcs)", "price": "$7.99", "desc": "Crispy golden spring rolls, vegetables + sweet chili sauce.", "type": "VEG"},
            {"name": "Mozzarella Cheese Sticks (6 pcs)", "price": "$8.99", "desc": "Mozzarella cheese sticks + sauce.", "type": "VEG"},
        ]
    },
    {
        "id": "rice-bowls-section",
        "title": "⚽ FIFA World Cup Rice Bowls",
        "items": [
            {"name": "World Cup Chicken Over Rice", "price": "$12.99", "desc": "Juicy grilled chicken served over seasoned yellow rice with fresh salad, topped with our signature garlic white sauce and spicy hot sauce.", "type": "NON-VEG"},
            {"name": "Nashville Hot Chicken Over Rice", "price": "$12.99", "desc": "Crispy Nashville hot chicken served over flavorful yellow rice, topped with pickles and a creamy ranch drizzle.", "type": "NON-VEG"},
            {"name": "Peri-Peri Chicken Rice Bowl", "price": "$12.99", "desc": "Tender peri-peri chicken served over seasoned rice with corn, onions, and a drizzle of creamy garlic sauce.", "type": "NON-VEG"},
            {"name": "Korean Chicken Rice Bowl", "price": "$12.99", "desc": "Crispy chicken glazed in sweet and spicy Korean sauce, served over rice and topped with green onions and sesame seeds.", "type": "NON-VEG"},
            {"name": "Dragon Chicken Rice Bowl", "price": "$12.99", "desc": "Crispy chicken tossed in a bold, spicy dragon sauce, served over seasoned rice with fresh vegetables.", "type": "NON-VEG"},
            {"name": "Paneer Over Rice", "price": "$12.99", "desc": "Crispy paneer served over seasoned rice and topped with our signature creamy garlic sauce.", "type": "VEG"},
            {"name": "Chicken Shawarma Rice Bowl", "price": "$12.99", "desc": "Tender shawarma-spiced chicken served over seasoned rice with fresh salad and our signature garlic sauce.", "type": "NON-VEG"},
            {"name": "Butter Chicken Rice Bowl", "price": "$12.99", "desc": "Tender chicken simmered in a rich, creamy butter sauce and served over fragrant seasoned rice.", "type": "NON-VEG"},
            {"name": "Famous HD Chicken Dum Biryani", "price": "$14.99", "desc": "Our signature Hyderabadi-style chicken dum biryani, slow-cooked with aromatic basmati rice, tender chicken, and authentic spices.", "type": "NON-VEG"},
            {"name": "Paneer Dum Biryani", "price": "$14.99", "desc": "Flavorful paneer and aromatic basmati rice slowly cooked in traditional Hyderabadi dum style with authentic spices.", "type": "VEG"},
        ]
    },
    {
        "id": "combo-deals-section",
        "title": "🏆 FIFA Combo Deals",
        "items": [
            {"name": "Goal Combo", "price": "$14.99", "desc": "Wings (6 pcs) + Fries + Soft Drink.", "type": "NON-VEG", "badge": "⭐ BEST SELLER"},
            {"name": "Hat-Trick Combo", "price": "$19.99", "desc": "Chicken Burger + Popcorn Chicken + Fries + Drink.", "type": "NON-VEG", "badge": "🔥 SPICY"},
            {"name": "Team Platter", "price": "$39.99", "desc": "Wings (12 pcs) + Chicken Strips + Loaded Fries + Spring Rolls + 4 Drinks.", "type": "NON-VEG", "badge": "👨‍👩‍👧‍👦 FAMILY SIZE"},
            {"name": "Champion Platter", "price": "$59.99", "desc": "Wings (20 pcs - 2 Flavors) + Popcorn Chicken + Chicken Strips + Loaded Fries + Chicken Quesadilla + Chicken Over Rice (HD Special) + Drinks.", "type": "NON-VEG", "badge": "👑 THE ULTIMATE"},
        ]
    }
]

def generate_badges(type_str, extra_badge=None):
    b = ""
    if type_str == "VEG":
        b += '<span class="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">VEG</span>'
    elif type_str == "NON-VEG":
        b += '<span class="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">NON-VEG</span>'
    
    if extra_badge:
        b += f'<span class="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-primary/10 text-primary border border-primary/20">{extra_badge}</span>'
    return b

def build_categories():
    out = ""
    for cat in menu_data:
        items_out = ""
        for item in cat["items"]:
            badge_html = generate_badges(item["type"], item.get("badge"))
            items_out += item_html.format(name=item["name"], price=item["price"], desc=item["desc"], badges=badge_html)
        out += category_html.format(id=cat["id"], title=cat["title"], ITEMS=items_out)
    return out

def main():
    base_file = "/Users/prudhviraj/FHDB-WEBSITE-DEPLOY-0/menu.html"
    with open(base_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    head_match = re.search(r'(?s)(<!DOCTYPE html>.*?<body[^>]*>).*?(<div data-site-header-root></div>)', content)
    head_str = head_match.group(1) + "\n" + head_match.group(2)
    
    # Modify title and description
    head_str = re.sub(r'<title>.*?</title>', '<title>FIFA World Cup Special Menu | Famous HD Biryani</title>', head_str)
    head_str = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Check out our limited-time FIFA World Cup Special Menu. Exclusive kickoff starters, fan favorites, and combo deals!">', head_str)
    head_str = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="FIFA World Cup Special Menu - Famous HD Biryani">', head_str)
    head_str = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="https://famoushdbiryani.com/fifa-menu">', head_str)
    
    footer_match = re.search(r'(?s)(<footer.*)', content)
    footer_str = footer_match.group(1)
    
    middle_str = html_template.replace("{CATEGORIES}", build_categories())
    
    # Inject sticky category script for scroll behavior
    sticky_script = """
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const tabs = document.querySelectorAll('.category-tab');
            const container = document.getElementById('category-container');
            const leftBtn = document.getElementById('scroll-cat-left');
            const rightBtn = document.getElementById('scroll-cat-right');

            // Scroll buttons
            if (leftBtn && rightBtn && container) {
                leftBtn.addEventListener('click', () => {
                    container.scrollBy({ left: -200, behavior: 'smooth' });
                });
                rightBtn.addEventListener('click', () => {
                    container.scrollBy({ left: 200, behavior: 'smooth' });
                });
            }

            // Click to scroll to section
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = tab.getAttribute('data-target');
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        const headerOffset = 160;
                        const elementPosition = targetEl.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                        
                        // Active state
                        tabs.forEach(t => {
                            t.classList.remove('text-primary', 'border-primary');
                            t.classList.add('text-gray-500', 'border-transparent');
                        });
                        tab.classList.remove('text-gray-500', 'border-transparent');
                        tab.classList.add('text-primary', 'border-primary');
                    }
                });
            });
            
            // Intercept Intersection Observer logic
            const sections = document.querySelectorAll('.menu-category');
            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0
            };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        tabs.forEach(t => {
                            if (t.getAttribute('data-target') === id) {
                                t.classList.remove('text-gray-500', 'border-transparent');
                                t.classList.add('text-primary', 'border-primary');
                                if (container) {
                                    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                }
                            } else {
                                t.classList.remove('text-primary', 'border-primary');
                                t.classList.add('text-gray-500', 'border-transparent');
                            }
                        });
                    }
                });
            }, observerOptions);

            sections.forEach(sec => observer.observe(sec));
        });
    </script>
    """
    
    middle_str += sticky_script
    
    full_html = head_str + middle_str + footer_str
    
    out_file = "/Users/prudhviraj/FHDB-WEBSITE-DEPLOY-0/fifa-menu.html"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full_html)
        
    print(f"Successfully wrote {out_file}")

if __name__ == "__main__":
    main()
