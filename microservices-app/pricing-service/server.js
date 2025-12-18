const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_pricing';

const priceSchema = new mongoose.Schema({
    product_id: String,
    amount: Number,
    currency: String
});
const Price = mongoose.model('Price', priceSchema);

fastify.get('/prices/:productId', async (request, reply) => {
    return Price.findOne({ product_id: request.params.productId });
});

fastify.post('/seed', async (request, reply) => {
    await Price.deleteMany({});
    if (request.body && request.body.data) {
        await Price.insertMany(request.body.data);
    }
    return { message: 'Pricing seeded' };
});

const start = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
