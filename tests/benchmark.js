import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration via environment variables
const ARCH = __ENV.ARCH || 'microservices'; // 'microservices' or 'harperdb'
const PAGE = __ENV.PAGE || 'plp';           // 'home', 'plp', 'pdp'
const VUS = parseInt(__ENV.VUS || '10');    // Default to low VUs
const DURATION = __ENV.DURATION || '30s';   // Default duration

// Base URLs
const CONFIG = {
    microservices: {
        base: 'http://localhost:3000',
        routes: {
            home: '/',
            plp: '/products',
            pdp: '/products/p_travel_0' // Valid ID
        }
    },
    harperdb: {
        base: 'http://localhost:9926',
        routes: {
            home: '/', // Harper static server serves index.html at root? Or needs checking? verified in app.js routing.
            // app.js uses hash routing for UI but backend endpoints are different. 
            // WAIT: We are benchmarking APIs or Frontend assets?
            // User request implies "Page types". 
            // For Microservices (Next/Express/Fastify), returns HTML or JSON? 
            // Previous tests hit /products (JSON).
            // Let's stick to API endpoints for data fetching as this is the bottleneck.
            // Harper: /catalog (PLP), /catalog/:id (PDP). 
            // Home? Harper serves static assets. Microservices serves FE?
            // Re-evaluating based on "UI not showing data". 
            // Tests should target the DATA ENDPOINTS used by the UI.

            // Harper endpoints:
            home: '/catalog?limit=8', // Home loads "featured" or list. app.js: fetchProducts() -> /Catalog
            plp: '/catalog',
            pdp: '/catalog/p_travel_0'
        }
    }
};

// Validate config
if (!CONFIG[ARCH]) throw new Error(`Unknown ARCH: ${ARCH}`);
if (!CONFIG[ARCH].routes[PAGE]) throw new Error(`Unknown PAGE: ${PAGE} for ${ARCH}`);

const BASE_URL = CONFIG[ARCH].base;
const ENDPOINT = CONFIG[ARCH].routes[PAGE];
const FULL_URL = `${BASE_URL}${ENDPOINT}`;

export const options = {
    vus: VUS,
    duration: DURATION,
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        http_req_failed: ['rate<0.01'],   // <1% errors
    },
};

export default function () {
    const res = http.get(FULL_URL, {
        headers: { 'Content-Type': 'application/json' },
        tags: { arch: ARCH, page: PAGE }
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
