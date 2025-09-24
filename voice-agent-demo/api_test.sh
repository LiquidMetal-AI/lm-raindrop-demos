#!/bin/bash

# API Test Script for voice-agent-demo
# Tests both GET /health and POST /process-voice endpoints

set -e

# Configuration
API_BASE_URL="YOUR_API_BASE_URL_HERE"
TEST_MP3_FILE="/Users/fokkedekker/Documents/lm_samba_hackathon/voice-agent-demo/test.mp3"
TOTAL_ENDPOINTS=2
PASSING=0
FAILING=0
FAILURE_DETAILS=()

echo "==============================================="
echo "API Endpoint Testing for voice-agent-demo"
echo "Base URL: $API_BASE_URL"
echo "==============================================="
echo

# Function to test GET /health endpoint
test_health_endpoint() {
    echo "Testing GET /health endpoint..."

    local response
    local http_code

    # Make the request and capture both response and HTTP code
    response=$(curl -s -w "%{http_code}" "$API_BASE_URL/health" || echo "CURL_ERROR")

    if [[ "$response" == "CURL_ERROR" ]]; then
        echo "❌ FAILED: Unable to connect to health endpoint"
        FAILING=$((FAILING + 1))
        FAILURE_DETAILS+=("GET /health: Connection failed")
        return 1
    fi

    # Extract HTTP code (last 3 characters)
    http_code="${response: -3}"
    # Extract response body (everything except last 3 characters)
    response_body="${response%???}"

    echo "  HTTP Code: $http_code"
    echo "  Response: $response_body"

    if [[ "$http_code" == "200" ]]; then
        echo "✅ PASSED: Health endpoint responding correctly"
        PASSING=$((PASSING + 1))
        return 0
    else
        echo "❌ FAILED: Health endpoint returned HTTP $http_code"
        FAILING=$((FAILING + 1))
        FAILURE_DETAILS+=("GET /health: HTTP $http_code - $response_body")
        return 1
    fi
}

# Function to test POST /process-voice endpoint
test_process_voice_endpoint() {
    echo "Testing POST /process-voice endpoint..."

    # Check if test file exists
    if [[ ! -f "$TEST_MP3_FILE" ]]; then
        echo "❌ FAILED: Test MP3 file not found at $TEST_MP3_FILE"
        FAILING=$((FAILING + 1))
        FAILURE_DETAILS+=("POST /process-voice: Test file not found")
        return 1
    fi

    local response
    local http_code

    # Make the request with file upload and save audio output
    response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Content-Type: multipart/form-data" \
        -F "audio=@$TEST_MP3_FILE;type=audio/mp3;filename=test.mp3" \
        --output "output_audio.wav" \
        --write-out "%{http_code}" \
        "$API_BASE_URL/process-voice" || echo "CURL_ERROR")

    if [[ "$response" == "CURL_ERROR" ]]; then
        echo "❌ FAILED: Unable to connect to process-voice endpoint"
        FAILING=$((FAILING + 1))
        FAILURE_DETAILS+=("POST /process-voice: Connection failed")
        return 1
    fi

    # The response is just the HTTP code when using --output
    http_code="$response"

    echo "  HTTP Code: $http_code"

    if [[ "$http_code" == "200" ]]; then
        echo "✅ PASSED: Process-voice endpoint responding correctly"
        echo "  Audio saved to: output_audio.wav"

        # Show file info
        if [[ -f "output_audio.wav" ]]; then
            file_size=$(ls -lh output_audio.wav | awk '{print $5}')
            echo "  File size: $file_size"
        fi

        PASSING=$((PASSING + 1))
        return 0
    else
        echo "❌ FAILED: Process-voice endpoint returned HTTP $http_code"
        FAILING=$((FAILING + 1))
        FAILURE_DETAILS+=("POST /process-voice: HTTP $http_code - $response_body")
        return 1
    fi
}

# Run tests
echo "Starting endpoint tests..."
echo

# Test 1: Health endpoint
test_health_endpoint
echo

# Test 2: Process voice endpoint
test_process_voice_endpoint
echo

# Summary
echo "==============================================="
echo "TEST SUMMARY"
echo "==============================================="
echo "Total endpoints tested: $TOTAL_ENDPOINTS"
echo "Passing: $PASSING"
echo "Failing: $FAILING"
echo

if [[ ${#FAILURE_DETAILS[@]} -gt 0 ]]; then
    echo "FAILURE DETAILS:"
    for detail in "${FAILURE_DETAILS[@]}"; do
        echo "  - $detail"
    done
    echo
fi

if [[ $FAILING -eq 0 ]]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. See details above."
    exit 1
fi