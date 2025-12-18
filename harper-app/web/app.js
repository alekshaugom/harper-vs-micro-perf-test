console.log('🛒 ShopFast App v6.0 - FIXED_SELECT_PARAM');
const app = document.getElementById('content');
const toggle = document.getElementById('arch-toggle');
const isHarper = window.location.port === '9926';

// Architecture Switcher Logic
toggle.checked = isHarper;

// Apply Theme
function applyTheme() {
    if (isHarper) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}
applyTheme();

toggle.addEventListener('change', () => {
    const targetPort = toggle.checked ? '9926' : '3000';
    let currentPath = window.location.hash.slice(1); // Get path from hash

    if (!toggle.checked) {
        // Switching TO Microservices (standard routing)
        // Remove hash and use normal path
        if (!currentPath) currentPath = '/';
        window.location.href = `http://${window.location.hostname}:${targetPort}${currentPath}`;
    } else {
        // Switching TO HarperDB (shouldn't happen here as this IS Harper app, but for completeness)
        window.location.href = `http://${window.location.hostname}:${targetPort}/#${currentPath}`;
    }
});

// Routing
const routes = {
    '/': renderHome,
    '/category/:slug': renderCategory,
    '/product/:id': renderProduct
};

async function router() {
    // Hash routing: get path from location.hash (remove #)
    let path = window.location.hash.slice(1) || '/';

    // Simple matching
    if (path === '/' || path === '/index.html') {
        await renderHome();
    } else if (path.startsWith('/category/')) {
        const slug = path.split('/')[2];
        await renderCategory(slug);
    } else if (path.startsWith('/product/')) {
        const id = path.split('/')[2];
        await renderProduct(id);
    } else {
        app.innerHTML = '<h1>404 - Not Found</h1>';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Navigation Helper
function navigate(path) {
    window.location.hash = path;
}

// Data Fetching Abstraction
async function fetchProducts(query = {}) {
    try {
        if (isHarper) {
            // HarperDB Native
            let url = `/catalog?_=${Date.now()}`;
            if (query.category) {
                url += `&category_id=${query.category}`;
            }
            if (query.id) {
                url = `/catalog/${query.id}?_=${Date.now()}`;
            }
            const res = await fetch(url);
            let data = await res.json();
            // Normalize
            if (!Array.isArray(data)) data = [data];
            return data.map(normalizeProduct);
        } else {
            // Microservices Gateway
            let url = '/products';
            if (query.id) url = `/products/${query.id}`;
            const res = await fetch(url);
            let data = await res.json();
            // Normalize
            if (!Array.isArray(data)) data = [data];

            if (query.category) {
                data = data.filter(p => p.category_id === query.category);
            }
            return data.map(normalizeProduct);
        }
    } catch (e) {
        console.error("Fetch error", e);
        return [];
    }
}

function normalizeProduct(p) {
    // Helper to extract single item from potential array
    const getOne = (val) => Array.isArray(val) ? val[0] : val;

    const priceObj = getOne(p.price);
    const invObj = getOne(p.inventory);
    const catObj = getOne(p.category);

    return {
        id: p.id || p._id,
        name: p.name,
        price: priceObj ? priceObj.amount : 0,
        currency: priceObj ? priceObj.currency : 'USD',
        emoji: p.emoji || '📦',
        category: catObj ? (catObj.name || catObj) : 'Unknown',
        description: p.description,
        inventory: invObj ? (typeof invObj === 'object' ? invObj.quantity : invObj) : 0,
        category_id: p.category_id
    };
}

// Renderers
async function renderHome() {
    app.innerHTML = '<div class="loader">Loading...</div>';
    const products = await fetchProducts();

    // Hardcoded Category list to ensure order/structure or unique set
    const categories = [
        { id: 'faces', name: 'Faces & Emotion' },
        { id: 'food', name: 'Food & Drink' },
        { id: 'animals', name: 'Animals & Nature' },
        { id: 'activities', name: 'Activities' },
        { id: 'travel', name: 'Travel & Places' },
        { id: 'objects', name: 'Objects' },
        { id: 'symbols', name: 'Symbols' },
        { id: 'flags', name: 'Flags' }
    ];

    let html = `
        <div class="hero">
            <h1>Emojis Are Us 🛍️</h1>
            <p>The Largest Emoji Sale of the Year!</p>
        </div>
        
        <h2>Browse by Category</h2>
        <div class="category-grid">
            ${categories.map(CategoryTile).join('')}
        </div>
    `;
    app.innerHTML = html;
}

function CategoryTile(c) {
    // We could map an emoji to each category id for the tile visual
    const tileEmoji = {
        'faces': '😀', 'food': '🍔', 'animals': '🐶', 'activities': '⚽',
        'travel': '🚗', 'objects': '⌚', 'symbols': '🏧', 'flags': '🏁'
    };

    return `
        <div class="category-tile" onclick="navigate('/category/${c.id}')">
            <div class="tile-emoji">${tileEmoji[c.id] || '📂'}</div>
            <div class="tile-name">${c.name}</div>
        </div>
    `;
}


async function renderCategory(slug) {
    app.innerHTML = '<div class="loader">Loading...</div>';
    const products = await fetchProducts({ category: slug });

    // Breadcrumbs
    const breadcrumbs = `
        <div class="breadcrumbs">
            <span onclick="navigate('/')">Home</span> > <span>${slug}</span>
        </div>
    `;

    let html = `
        ${breadcrumbs}
        <h1>${slug.toUpperCase()}</h1>
        <div class="grid">
            ${products.map(ProductCard).join('')}
        </div>
    `;
    app.innerHTML = html;
}

async function renderProduct(id) {
    app.innerHTML = '<div class="loader">Loading...</div>';
    const [product] = await fetchProducts({ id });

    if (!product) {
        app.innerHTML = '<h1>Product Not Found</h1>';
        return;
    }

    // Breadcrumbs
    const breadcrumbs = `
        <div class="breadcrumbs">
            <span onclick="navigate('/')">Home</span> > <span onclick="navigate('/category/${product.category_id}')">${product.category_id}</span> > <span>${product.name}</span>
        </div>
    `;

    app.innerHTML = `
        ${breadcrumbs}
        <div class="pdp-container">
            <div class="pdp-image">${product.emoji}</div>
            <div class="pdp-details">
                <span style="color:var(--primary); font-weight:bold;">${product.category}</span>
                <h1>${product.name}</h1>
                <p style="color:#aaa;">${product.description}</p>
                <div class="pdp-price">$${product.price.toFixed(2)}</div>
                <div class="stock" style="color:${product.inventory > 0 ? 'var(--success)' : 'red'}">
                    ${product.inventory > 0 ? `In Stock (${product.inventory})` : 'Out of Stock'}
                </div>
                <button class="btn">Add to Cart</button>
            </div>
        </div>
    `;
}

function ProductCard(p) {
    return `
        <div class="card" onclick="navigate('/product/${p.id}')">
            <span class="emoji-img">${p.emoji}</span>
            <h3>${p.name}</h3>
            <div class="price">$${p.price.toFixed(2)}</div>
            <div class="meta">
                <span>${p.category}</span>
                <span>${p.inventory > 0 ? 'In Stock' : 'Out'}</span>
            </div>
        </div>
    `;
}
