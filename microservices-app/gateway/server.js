const fastify = require('fastify')({ logger: true });
const path = require('path');
const axios = require('axios');

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/', // optional: default '/'
});

const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:3001';
const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:3002';
const PRICING_URL = process.env.PRICING_URL || 'http://localhost:3003';
const REVIEWS_URL = process.env.REVIEWS_URL || 'http://localhost:3004';

// Get All Products
fastify.get('/products', async (request, reply) => {
    const { data: products } = await axios.get(`${CATALOG_URL}/products`);

    const detailedProducts = await Promise.all(products.map(async (p) => {
        try {
            const [inv, price, reviews] = await Promise.all([
                axios.get(`${INVENTORY_URL}/inventory/${p._id}`).catch(() => ({ data: { quantity: 0 } })),
                axios.get(`${PRICING_URL}/prices/${p._id}`).catch(() => ({ data: null })),
                axios.get(`${REVIEWS_URL}/reviews/${p._id}`).catch(() => ({ data: [] }))
            ]);
            return {
                ...p,
                inventory: inv.data ? inv.data.quantity : 0,
                price: price.data,
                reviews: reviews.data
            };
        } catch (e) {
            return p;
        }
    }));

    return detailedProducts;
});

// Single Product with Details
fastify.get('/products/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const { data: product } = await axios.get(`${CATALOG_URL}/products/${id}`);

        const [inv, price, reviews] = await Promise.all([
            axios.get(`${INVENTORY_URL}/inventory/${id}`).catch(() => ({ data: { quantity: 0 } })),
            axios.get(`${PRICING_URL}/prices/${id}`).catch(() => ({ data: null })),
            axios.get(`${REVIEWS_URL}/reviews/${id}`).catch(() => ({ data: [] }))
        ]);

        return {
            ...product,
            inventory: inv.data ? inv.data.quantity : 0,
            price: price.data,
            reviews: reviews.data
        };
    } catch (e) {
        reply.code(404).send({ error: 'Product not found' });
    }
});

// Seed All with Generated Data
fastify.post('/seed', async (request, reply) => {
    const { DATA, SAMPLE_ADJECTIVES, emojiToName } = require('../../shared-data.js');

    const SAMPLE_NOUNS = ['Edition', 'Bundle', 'Pack', 'Set', 'Collection', 'Assortment', 'Kit', 'Box', 'Crate', 'Container'];

    const products = [];
    const inventories = [];
    const prices = [];
    const reviews = [];

    for (const cat of DATA) {
        for (let i = 0; i < cat.emojis.length; i++) {
            const emoji = cat.emojis[i];
            const id = `p_${cat.id}_${i}`; // Custom String ID to match

            // Try to get emoji name from shortcode, fallback to template
            const emojiName = emojiToName(emoji);
            const name = emojiName || `${SAMPLE_ADJECTIVES[i % SAMPLE_ADJECTIVES.length]} ${cat.name} ${emoji}`;

            // Log when fallback is used
            if (!emojiName) {
                console.log(`⚠️  No shortcode for ${emoji}, using fallback: ${name}`);
            }

            const description = `This is a generic description for ${name}. It is a high quality product representing ${emoji}.`;

            // For Mongo, we will force _id to match our custom ID if possible or use a separate id field.
            // Mongoose allows _id to be string.
            products.push({ _id: id, name, description, category_id: cat.id, category: { name: cat.name }, emoji });
            inventories.push({ product_id: id, quantity: Math.floor(Math.random() * 100) });
            prices.push({ product_id: id, amount: parseFloat((Math.random() * 100 + 10).toFixed(2)), currency: 'USD' });
            if (Math.random() > 0.5) {
                reviews.push({ product_id: id, rating: Math.floor(Math.random() * 5) + 1, comment: 'Generated review.' });
            }
        }
    }

    // Push to services (Assuming they support bulk seed via POST /seed body)
    await Promise.all([
        axios.post(`${CATALOG_URL}/seed`, { data: products }),
        axios.post(`${INVENTORY_URL}/seed`, { data: inventories }),
        axios.post(`${PRICING_URL}/seed`, { data: prices }),
        axios.post(`${REVIEWS_URL}/seed`, { data: reviews })
    ]);

    return { message: 'All services seeded with 1000 items' };
});

// SPA Fallback for Category and Product pages
fastify.get('/category/*', (req, reply) => {
    reply.sendFile('index.html');
});

fastify.get('/product/*', (req, reply) => {
    reply.sendFile('index.html');
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
