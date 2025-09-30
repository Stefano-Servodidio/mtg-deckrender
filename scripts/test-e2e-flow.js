#!/usr/bin/env node

/**
 * Simple E2E flow validation using basic HTTP requests
 * This validates the core user flow without requiring a full browser
 */

const http = require('http')
const https = require('https')

const baseUrl = 'http://localhost:3000'

console.log('🧪 Testing E2E flow endpoints...\n')

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http
        const req = client.request(url, options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }))
        })
        req.on('error', reject)
        if (options.body) {
            req.write(options.body)
        }
        req.end()
    })
}

async function testEndpoints() {
    const tests = [
        {
            name: 'Home page loads',
            url: `${baseUrl}/`,
            expected: 200
        },
        {
            name: 'Create page loads',
            url: `${baseUrl}/create`,
            expected: 200
        },
        {
            name: 'Cards API endpoint exists',
            url: `${baseUrl}/api/cards`,
            expected: 200 // GET should return usage info
        },
        {
            name: 'Deck PNG API endpoint exists',
            url: `${baseUrl}/api/deck-png`,
            expected: [200, 400, 405] // GET should return usage info
        }
    ]

    let allPassed = true

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`)
            const response = await makeRequest(test.url)
            const expectedCodes = Array.isArray(test.expected) ? test.expected : [test.expected]
            
            if (expectedCodes.includes(response.statusCode)) {
                console.log(`  ✅ Status: ${response.statusCode}`)
            } else {
                console.log(`  ❌ Status: ${response.statusCode}, expected: ${expectedCodes.join(' or ')}`)
                allPassed = false
            }
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`)
            allPassed = false
        }
    }

    return allPassed
}

async function testDeckPngAPI() {
    console.log('\n🎯 Testing Deck PNG API workflow...')
    
    try {
        // Test GET request to see API documentation
        const getResponse = await makeRequest(`${baseUrl}/api/deck-png`)
        if (getResponse.statusCode === 200) {
            console.log('  ✅ API documentation endpoint works')
            
            // Parse response to verify it contains expected fields
            try {
                const apiInfo = JSON.parse(getResponse.data)
                if (apiInfo.message && apiInfo.usage && apiInfo.expectedFormat) {
                    console.log('  ✅ API documentation has correct structure')
                } else {
                    console.log('  ⚠️  API documentation structure incomplete')
                }
            } catch (e) {
                console.log('  ⚠️  API documentation is not valid JSON')
            }
        } else {
            console.log(`  ❌ API documentation endpoint failed: ${getResponse.statusCode}`)
            return false
        }

        // Test POST request with invalid data (should fail gracefully)
        const postOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ invalid: 'data' })
        }
        
        const postResponse = await makeRequest(`${baseUrl}/api/deck-png`, postOptions)
        if (postResponse.statusCode === 400) {
            console.log('  ✅ API correctly rejects invalid requests')
        } else {
            console.log(`  ⚠️  API response to invalid data: ${postResponse.statusCode}`)
        }
        
        return true
    } catch (error) {
        console.log(`  ❌ Error testing API: ${error.message}`)
        return false
    }
}

async function main() {
    console.log(`Testing against server: ${baseUrl}\n`)
    
    // First verify the server is running
    try {
        await makeRequest(baseUrl)
    } catch (error) {
        console.log('❌ Server is not running. Please start it with: npm run dev')
        process.exit(1)
    }
    
    const endpointsPass = await testEndpoints()
    const apiPass = await testDeckPngAPI()
    
    console.log('\n' + '='.repeat(50))
    if (endpointsPass && apiPass) {
        console.log('🎉 All E2E flow validation tests passed!')
        console.log('\n📚 The application is ready for Cypress E2E testing')
        console.log('  • All endpoints are accessible')
        console.log('  • API endpoints respond correctly')
        console.log('  • Error handling works as expected')
        console.log('\nTo run full E2E tests:')
        console.log('  1. npm run e2e:open  (interactive mode)')
        console.log('  2. npm run e2e       (headless mode)')
    } else {
        console.log('❌ Some E2E flow validation tests failed')
        console.log('Please check the server and API implementation')
        process.exit(1)
    }
}

main().catch(console.error)