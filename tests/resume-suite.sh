#!/bin/bash

# Configuration
VUS_LEVELS=(20 200 2000)
ARCHS=("microservices" "harperdb")
PAGES=("home" "plp" "pdp")
DURATION=${DURATION:-1m}

mkdir -p test-results

echo "Resuming Performance Test Suite..."

for vus in "${VUS_LEVELS[@]}"; do
    echo "=========================================="
    echo "Concurrency Level: $vus VUs"
    echo "=========================================="
    
    for arch in "${ARCHS[@]}"; do
        for page in "${PAGES[@]}"; do
            FILE="test-results/results_${arch}_${page}_${vus}.json"
            if [ -f "$FILE" ]; then
                echo "Skipping already completed: $arch | $page | $vus VUs"
                continue
            fi

            echo "Running: $arch | $page | $vus VUs..."
            
            # Run k6
            ./k6 run \
                -e ARCH=$arch \
                -e PAGE=$page \
                -e VUS=$vus \
                -e DURATION=$DURATION \
                --summary-export "$FILE" \
                tests/benchmark.js > /dev/null
            
            echo "Done."
            sleep 5 # Cooldown
        done
    done
done

echo "Test Suite Completed."
echo "Generating Report..."
node tests/generate-report.js
