const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../test-results');
const OUTPUT_FILE = path.join(__dirname, '../BENCHMARK_REPORT.md');

const ARCHS = ['microservices', 'harperdb'];
const PAGES = ['home', 'plp', 'pdp'];
const VUS = [20, 200, 2000];

function getResult(arch, page, vus) {
    const file = path.join(RESULTS_DIR, `results_${arch}_${page}_${vus}.json`);
    if (!fs.existsSync(file)) return null;
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const metrics = data.metrics;
        return {
            p50: metrics.http_req_duration?.med || 0,
            p95: metrics.http_req_duration?.['p(95)'] || 0,
            reqs: metrics.http_reqs?.rate || 0,
            errorRate: metrics.http_req_failed?.value || 0
        };
    } catch (e) {
        return null;
    }
}

let markdown = '# Benchmark Report\n\n';
markdown += '| Architecture | Page | VUs | p50 (ms) | p95 (ms) | Req/s | Error % |\n';
markdown += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

VUS.forEach(vus => {
    PAGES.forEach(page => {
        const mRes = getResult('microservices', page, vus);
        const hRes = getResult('harperdb', page, vus);

        [
            { name: 'Microservices', res: mRes },
            { name: 'HarperDB', res: hRes }
        ].forEach(entry => {
            if (entry.res) {
                markdown += `| ${entry.name} | ${page.toUpperCase()} | ${vus} | ${entry.res.p50.toFixed(2)} | ${entry.res.p95.toFixed(2)} | ${entry.res.reqs.toFixed(2)} | ${(entry.res.errorRate * 100).toFixed(2)}% |\n`;
            } else {
                markdown += `| ${entry.name} | ${page.toUpperCase()} | ${vus} | N/A | N/A | N/A | N/A |\n`;
            }
        });

        // Calculate Delta (Harper vs Micro)
        if (mRes && hRes && mRes.p95 > 0) {
            const p95Delta = ((hRes.p95 - mRes.p95) / mRes.p95) * 100;
            const reqDelta = ((hRes.reqs - mRes.reqs) / mRes.reqs) * 100;
            markdown += `| **Delta** | | | | **${p95Delta > 0 ? '+' : ''}${p95Delta.toFixed(1)}%** | **${reqDelta > 0 ? '+' : ''}${reqDelta.toFixed(1)}%** | |\n`;
        }
        markdown += '| | | | | | | |\n'; // Spacer
    });
});

fs.writeFileSync(OUTPUT_FILE, markdown);
console.log(`Report generated at ${OUTPUT_FILE}`);
