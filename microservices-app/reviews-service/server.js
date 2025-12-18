const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_reviews';

const reviewSchema = new mongoose.Schema({
    product_id: String,
    rating: Number,
    comment: String
});
const Review = mongoose.model('Review', reviewSchema);

fastify.get('/reviews/:productId', async (request, reply) => {
    return Review.find({ product_id: request.params.productId });
});

fastify.post('/seed', async (request, reply) => {
    await Review.deleteMany({});
    if (request.body && request.body.data) {
        await Review.insertMany(request.body.data);
    }
    return { message: 'Reviews seeded' };
});

const start = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        await fastify.listen({ port: 3004, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
