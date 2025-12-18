const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_inventory';

const inventorySchema = new mongoose.Schema({
    product_id: String,
    quantity: Number
});
const Inventory = mongoose.model('Inventory', inventorySchema);

fastify.get('/inventory/:productId', async (request, reply) => {
    return Inventory.findOne({ product_id: request.params.productId });
});

fastify.post('/seed', async (request, reply) => {
    await Inventory.deleteMany({});
    if (request.body && request.body.data) {
        await Inventory.insertMany(request.body.data);
    }
    return { message: 'Inventory seeded' };
});

const start = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
