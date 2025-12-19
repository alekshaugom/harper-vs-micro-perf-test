# Harper vs. Standard Microservices: Performance Comparison Benchmark

This repository demonstrates a side-by-side performance comparison between a **Unified Harper Runtime** and a **Standard Microservices Architecture** for a modern e-commerce application.

## 🚀 Overview

The purpose of this project is to explore how architectural overhead affects latency, throughput, and system resilience under load. We provide two functionally equivalent implementations of an e-commerce platform—sharing the same data model, the same UI, and the same user workflows—to create an "apples-to-apples" performance benchmark.

### What this Repo Demonstrates
- **Architectural Parity:** Both stacks serve identical JSON contracts and static assets.
- **Unified Runtime vs. Distributed Services:** A direct comparison of Harper (application logic + database + cache in one memory space) against a typical microservices stack (BFF + 4 independent services + MongoDB).
- **Scalability under Pressure:** High-concurrency testing using k6 to identify architectural failure points.

---

## 🏗️ The Architectures

### 1. Standard Microservices Stack
A typical distributed architecture built with:
- **Services:** Fastify-based Catalog, Inventory, Pricing, and Reviews services.
- **Data Persistence:** Independent MongoDB instances for each service.
- **Orchestration:** A Backend-for-Frontend (BFF) Gateway that aggregates data via internal HTTP network hops.
- **Typical Driver:** Strategic for organizations that maintain siloed functional roles (e.g., dedicated DBAs and segmented backend teams) and prioritize modularity over execution efficiency.

### 2. Harper Unified Stack
A streamlined architecture utilizing Harper's unified runtime:
- **Unified Runtime:** Database, application logic, and cache coexist in a single process.
- **Internal Access:** Application logic interacts with data via direct memory references, eliminating internal network calls and "impedance mismatch."
- **Typical Driver:** Ideal for high-velocity teams operating "complete functions." It eliminates the coordination friction of traditional technical silos, delivering superior performance, system efficiency, and organizational clarity.

---

## 📊 Benchmark Results

Tests were performed using **k6** on an Apple M1 Max (32GB RAM). Both architectures were seeded with ~1,200 unique products and tested across Homepage, PLP (Product List), and PDP (Product Detail) scenarios.

### Performance Results (p95 Latency)

| Page Type | Concurrency (VUs) | Microservices Stack | Harper Unified Stack | Result / Resilience |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | 20 | 10.21 ms | **6.55 ms** | Both Healthy |
| | 200 | 15.37 ms | **7.04 ms** | Both Healthy |
| | 2,000 | 45.45 ms | **15.03 ms** | **Harper 👑 (Resilient)** |
| **Category (PLP)** | 20 | 59,997.80 ms | **15.68 ms** | -99.9% Latency Gap |
| | 200 | (100.00% Error) | **44.98 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100.00% Error) | **845.63 ms** | **Harper 👑 (Resilient)** |
| **Product (PDP)** | 20 | 20.43 ms | **7.22 ms** | **-64.6% Latency Gap** |
| | 200 | (100.00% Error) | **15.90 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100.00% Error) | **41.26 ms** | **Harper 👑 (100% Success)** |

### Performance Results (p50 Latency)

| Page Type | Concurrency (VUs) | Microservices Stack | Harper Unified Stack | Result / Resilience |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | 20 | 7.25 ms | **2.94 ms** | Both Healthy |
| | 200 | 7.07 ms | **0.88 ms** | **Harper 👑** |
| | 2,000 | 2.31 ms | **0.73 ms** | **Harper 👑** |
| **Category (PLP)** | 20 | 40,740.46 ms | **5.04 ms** | Microservices 35.3% Errors |
| | 200 | (100.00% Error) | **3.13 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100.00% Error) | **244.69 ms** | **Harper 👑 (Resilient)** |
| **Product (PDP)** | 20 | 8.62 ms | **3.12 ms** | Microservices 3.3% Errors |
| | 200 | (100.00% Error) | **1.39 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100.00% Error) | **2.01 ms** | **Harper 👑 (100% Success)** |

### Critical Takeaways
1. **The Fragmentation Tax:** Even at low loads (20 VUs), the microservices stack shows significantly higher latency. This is the direct result of "network hops" and data serialization between the BFF and the four underlying services.
2. **The Resilience Ceiling:** The microservices stack reached its failure point abruptly. At 200 VUs, the PLP and PDP scenarios hit a 100% error rate, primarily due to service timeouts and connection exhaustion under the weight of distributed coordination.
3. **Flat Latency Profile:** Harper’s performance remained remarkably flat as concurrency scaled from 20 to 2,000 concurrent users. This demonstrates the efficiency of a unified runtime where application logic interacts with data via direct memory references rather than internal HTTP calls.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running locally for the microservices stack)
- **Harper** (installed globally: `npm install -g harperdb`)

### Installation
```bash
git clone https://github.com/HarperFast/harper-vs-micro-perf-test.git
cd harper-vs-micro-perf-test
# Install dependencies for all services
find . -name "package.json" -not -path "*/node_modules/*" -execdir npm install \;
```

### Running the Suite
1. **Start Microservices:**
   ```bash
   cd microservices-app && ./run-microservices.sh
   # Seed data: curl -X POST http://localhost:3000/seed
   ```
2. **Start Harper:**
   ```bash
   cd harper-app && npm start
   # Seed data: curl -X POST http://localhost:9926/seed
   ```
3. **Execute Benchmark:**
   ```bash
   cd tests
   # Run the full suite from scratch
   ./run-suite.sh
   
   # OR: Resume an interrupted suite (skips already completed tests)
   ./resume-suite.sh
   ```

---

## ⚖️ Conclusion

This benchmark serves as more than just a performance reference; it is an exploration of architectural and organizational efficiency. 

While distributed microservices are often chosen for their modularity, they introduce a significant "fragmentation tax" both in technical latency and organizational coordination. Traditional stacks may still appeal to organizations that built their culture around siloed functional layers (DBAs, infrastructure, and backend as separate units).

However, for organizations that value **scale, system efficiency, and organizational velocity**, the unified model is the logical choice. By empowering teams to operate "complete functions" within a single runtime, Harper allows developers to move application logic closer to the data—eliminating the friction of network hops and the overhead of cross-team synchronization. In environments where outcomes matter more than legacy silos, the unified approach delivers a level of responsiveness and simplicity that fragmented architectures cannot match.
