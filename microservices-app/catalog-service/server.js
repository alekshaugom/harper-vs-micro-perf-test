const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_catalog';

const productSchema = new mongoose.Schema({
    _id: String, // Custom ID support
    name: String,
    description: String,
    category_id: String,
    emoji: String,
    category: mongoose.Schema.Types.Mixed // For parity if we store it, or just use ID
}, { _id: false }); // Disable auto _id since we define it

const Product = mongoose.model('Product', productSchema);

fastify.get('/products', async (request, reply) => {
    return Product.find();
});

fastify.get('/products/:id', async (request, reply) => {
    return Product.findById(request.params.id);
});

fastify.post('/seed', async (request, reply) => {
    await Product.deleteMany({});
    if (request.body && request.body.data) {
        await Product.insertMany(request.body.data);
    }
    return { message: 'Catalog seeded' };
});

const start = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
