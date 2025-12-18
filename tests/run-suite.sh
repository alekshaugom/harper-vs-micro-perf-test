#!/bin/bash

# Configuration
VUS_LEVELS=(20 200 2000)
ARCHS=("microservices" "harperdb")
PAGES=("home" "plp" "pdp")
DURATION=${DURATION:-1m}

mkdir -p test-results

echo "Starting Performance Test Suite..."

for vus in "${VUS_LEVELS[@]}"; do
    echo "=========================================="
    echo "Concurrency Level: $vus VUs"
    echo "=========================================="
    
    for arch in "${ARCHS[@]}"; do
        for page in "${PAGES[@]}"; do
            echo "Running: $arch | $page | $vus VUs..."
            
            # Run k6
            ./k6 run \
                -e ARCH=$arch \
                -e PAGE=$page \
                -e VUS=$vus \
                -e DURATION=$DURATION \
                --summary-export test-results/results_${arch}_${page}_${vus}.json \
                tests/benchmark.js > /dev/null
            
            echo "Done."
            sleep 5 # Cooldown
        done
    done
done

echo "Test Suite Completed."
echo "Generating Report..."
node tests/generate-report.js
