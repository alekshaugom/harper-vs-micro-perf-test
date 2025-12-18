// Add global node_modules to search path
process.env.NODE_PATH = '/usr/local/lib/node_modules';
require('module').Module._initPaths();

const Module = require('module');
const orig = Module.prototype.require;
Module.prototype.require = function (n) {
    if (n && n.includes('pprof')) {
        return {
            heap: { start: () => { }, stop: () => { } },
            time: { start: () => { }, stop: () => { } },
            encode: (p) => p,
            decode: (b) => b
        };
    }
    return orig.apply(this, arguments);
};

const fastify = require('/usr/local/lib/node_modules/harperdb/node_modules/fastify')({ logger: true });
const path = require('path');
const { tables } = require('/usr/local/lib/node_modules/harperdb');
const resources = require('./resources.js');

const Catalog = new resources.catalog();
const Seed = new resources.seed();

// Mock Resource class if not available in globals
if (typeof Resource === 'undefined') {
    global.Resource = class { };
}

// Routes
fastify.get('/catalog/:id', async (request, reply) => {
    try {
        const result = await Catalog.get({
            path: request.params,
            query: request.query,
            url: request.url
        });
        return result;
    } catch (err) {
        reply.status(500).send({ error: err.message });
    }
});

fastify.get('/catalog', async (request, reply) => {
    try {
        const result = await Catalog.get({
            path: {},
            query: request.query,
            url: request.url
        });
        return result;
    } catch (err) {
        reply.status(500).send({ error: err.message });
    }
});

fastify.post('/seed', async (request, reply) => {
    try {
        const result = await Seed.post();
        return result;
    } catch (err) {
        reply.status(500).send({ error: err.message });
    }
});

// Static files
fastify.register(require('/usr/local/lib/node_modules/harperdb/node_modules/@fastify/static'), {
    root: path.join(__dirname, 'web'),
    prefix: '/',
});

// Root index.html redirect
fastify.get('/', async (request, reply) => {
    return reply.sendFile('index.html');
});

const start = async () => {
    try {
        await fastify.listen({ port: 9926, host: '0.0.0.0' });
        console.log('Standalone Optimization Server running on port 9926');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
