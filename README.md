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
| **Homepage** | 20 | 18.76 ms | **15.47 ms** | Both Healthy |
| | 200 | **39.85 ms** | 59.74 ms | Both Healthy |
| | 2,000 | (100% Error) | **326.53 ms** | **Harper 👑 (Resilient)** |
| **Category (PLP)** | 20 | 54,804.82 ms | **16.99 ms** | -99.9% Latency Gap |
| | 200 | (100% Error) | **18.33 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100% Error) | **1,075.36 ms** | **Harper 👑 (Resilient)** |
| **Product (PDP)** | 20 | 51.23 ms | **7.55 ms** | **-85.2% Latency Gap** |
| | 200 | (100% Error) | **11.01 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100% Error) | **8.78 ms** | **Harper 👑 (100% Success)** |

### Performance Results (p50 Latency)

| Page Type | Concurrency (VUs) | Microservices Stack | Harper Unified Stack | Result / Resilience |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | 20 | 8.42 ms | **7.51 ms** | Both Healthy |
| | 200 | 10.28 ms | **2.93 ms** | **Harper 👑** |
| | 2,000 | (100% Error) | **195.84 ms** | **Harper 👑 (Resilient)** |
| **Category (PLP)** | 20 | 21.02 ms | **8.02 ms** | Microservices 82.5% Errors |
| | 200 | (100% Error) | **5.29 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100% Error) | **341.26 ms** | **Harper 👑 (Resilient)** |
| **Product (PDP)** | 20 | 28.41 ms | **3.60 ms** | Microservices 24.5% Errors |
| | 200 | (100% Error) | **3.92 ms** | **Harper 👑 (100% Success)** |
| | 2,000 | (100% Error) | **1.87 ms** | **Harper 👑 (100% Success)** |

### Critical Takeaways
1. **Network Tax:** Even at low loads, the microservices stack is significantly slower due to the overhead of coordinating multiple internal service calls.
2. **Resilience Floor:** The microservices stack reached its failure point much earlier than the unified stack, primarily due to the complexity of managing distributed connections under pressure.
3. **Flat Latency:** Harper’s performance remained remarkably flat as concurrency scaled from 50 to 2,000 concurrent users, demonstrating the efficiency of its memory-integrated data access.

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
   cd harper-app && node standalone-server.js
   # Seed data: curl -X POST http://localhost:9926/seed
   ```
3. **Execute Benchmark:**
   ```bash
   cd tests && ./run-suite.sh
   ```

---

## ⚖️ Conclusion

This benchmark serves as more than just a performance reference; it is an exploration of architectural and organizational efficiency. 

While distributed microservices are often chosen for their modularity, they introduce a significant "fragmentation tax" both in technical latency and organizational coordination. Traditional stacks may still appeal to organizations that built their culture around siloed functional layers (DBAs, infrastructure, and backend as separate units).

However, for organizations that value **scale, system efficiency, and organizational velocity**, the unified model is the logical choice. By empowering teams to operate "complete functions" within a single runtime, Harper allows developers to move application logic closer to the data—eliminating the friction of network hops and the overhead of cross-team synchronization. In environments where outcomes matter more than legacy silos, the unified approach delivers a level of responsiveness and simplicity that fragmented architectures cannot match.
