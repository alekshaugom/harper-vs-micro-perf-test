const { tables, Resource } = require('/usr/local/lib/node_modules/harperdb');
const { DATA, SAMPLE_ADJECTIVES, emojiToName } = require('../shared-data.js');

class catalog extends Resource {
    async get(request) {
        request.query = request.query || {};

        if (request.url && request.url.includes('?')) {
            const queryString = request.url.split('?')[1];
            const searchParams = new URLSearchParams(queryString);
            searchParams.forEach((val, key) => {
                request.query[key] = val;
            });
        }

        let id = request.path?.id || null;
        if (!id && request.url) {
            const parts = request.url.split('/');
            const lastPart = parts[parts.length - 1].split('?')[0];
            if (lastPart && lastPart !== 'catalog' && lastPart !== '' && lastPart !== 'Catalog') {
                id = lastPart;
            }
        }
        if (!id) id = request.query.id;

        if (id) {
            const product = await tables.Product.get(id);
            if (!product) return null;

            const inventoryPromise = (async () => {
                const results = [];
                for await (const item of tables.Inventory.search({ conditions: [{ attribute: 'product_id', value: id }] })) {
                    results.push(item);
                }
                return results;
            })();

            const pricePromise = (async () => {
                const results = [];
                for await (const item of tables.Price.search({ conditions: [{ attribute: 'product_id', value: id }] })) {
                    results.push(item);
                }
                return results;
            })();

            const reviewsPromise = (async () => {
                const results = [];
                for await (const item of tables.Review.search({ conditions: [{ attribute: 'product_id', value: id }] })) {
                    results.push(item);
                }
                return results;
            })();

            const categoryPromise = (async () => {
                if (product.category_id) {
                    return await tables.Category.get(product.category_id);
                }
                return null;
            })();

            const [inventory, price, reviews, category] = await Promise.all([
                inventoryPromise,
                pricePromise,
                reviewsPromise,
                categoryPromise
            ]);

            return Object.assign({}, JSON.parse(JSON.stringify(product)), {
                inventory: inventory?.[0] || null,
                price: price?.[0] || null,
                reviews: reviews || [],
                category: category || null
            });
        }

        // PLP/Search Logic: Efficient Bulk Enrichment
        const category_id = request.query.category_id;
        const [products, prices, inventories, categories] = await Promise.all([
            (async () => {
                const results = [];
                const searchOptions = category_id
                    ? { conditions: [{ attribute: 'category_id', value: category_id }] }
                    : {};
                for await (const p of tables.Product.search(searchOptions)) results.push(p);
                return results;
            })(),
            (async () => {
                const results = [];
                for await (const p of tables.Price.search()) results.push(p);
                return results;
            })(),
            (async () => {
                const results = [];
                for await (const i of tables.Inventory.search()) results.push(i);
                return results;
            })(),
            (async () => {
                const results = [];
                for await (const c of tables.Category.search()) results.push(c);
                return results;
            })()
        ]);



        const priceMap = new Map(prices.map(p => [p.product_id, p]));
        const invMap = new Map(inventories.map(i => [i.product_id, i]));
        const catMap = new Map(categories.map(c => [c.id, c]));

        return products.map(product => {
            return Object.assign({}, product, {
                price: priceMap.get(product.id) || null,
                inventory: invMap.get(product.id) || null,
                category: catMap.get(product.category_id) || null,
                reviews: [] // Reviews can be added here if needed, but keeping lean for PLP
            });
        });
    }
}

class seed extends Resource {
    async post() {
        console.log('Clearing existing data...');
        try {
            const deletePromises = [];
            for await (const product of tables.Product.search()) deletePromises.push(tables.Product.delete(product.id));
            for await (const price of tables.Price.search()) deletePromises.push(tables.Price.delete(price.id));
            for await (const inv of tables.Inventory.search()) deletePromises.push(tables.Inventory.delete(inv.id));
            for await (const cat of tables.Category.search()) deletePromises.push(tables.Category.delete(cat.id));
            await Promise.all(deletePromises);
        } catch (e) { }

        console.log('Seeding data...');
        for (const catData of DATA) {
            await tables.Category.put({
                id: catData.id,
                name: catData.name
            });

            for (let i = 0; i < catData.emojis.length; i++) {
                const emoji = catData.emojis[i];
                const id = `p_${catData.id}_${i}`;
                const name = `${SAMPLE_ADJECTIVES[i % SAMPLE_ADJECTIVES.length]} ${emojiToName(emoji)}`;

                await tables.Product.put({
                    id,
                    name,
                    description: `A beautiful ${name} for your collection.`,
                    emoji,
                    category_id: catData.id
                });

                await tables.Price.put({
                    id: `price_${id}`,
                    product_id: id,
                    amount: Math.floor(Math.random() * 90) + 10,
                    currency: 'USD'
                });

                await tables.Inventory.put({
                    id: `inv_${id}`,
                    product_id: id,
                    quantity: Math.floor(Math.random() * 100)
                });
            }
        }
        return { status: 'success', message: 'Database seeded correctly' };
    }
}

exports.catalog = catalog;
exports.seed = seed;
