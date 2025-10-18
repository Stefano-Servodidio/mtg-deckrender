#!/usr/bin/env node

/**
 * Validation script for Cypress E2E testing setup
 * This script validates the configuration without requiring the Cypress binary
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Validating Cypress E2E setup...\n')

// Check if required files exist
const requiredFiles = [
    'cypress.config.ts',
    'cypress/support/e2e.ts',
    'cypress/support/commands.ts',
    'cypress/support/component.ts',
    'cypress/e2e/deck-to-png-flow.cy.ts',
    'cypress/e2e/navigation.cy.ts',
    'cypress/fixtures/sample-decklists.json',
    'E2E.MD'
]

let allFilesExist = true

console.log('📁 Checking required files:')
requiredFiles.forEach((file) => {
    const filePath = path.join(__dirname, '..', file)
    if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`)
    } else {
        console.log(`  ❌ ${file} - MISSING`)
        allFilesExist = false
    }
})

// Check package.json for required dependencies and scripts
console.log('\n📦 Checking package.json:')
const packageJsonPath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    // Check dependencies
    const requiredDeps = ['cypress', '@cypress/react', 'start-server-and-test']
    const devDeps = packageJson.devDependencies || {}

    requiredDeps.forEach((dep) => {
        if (devDeps[dep]) {
            console.log(`  ✅ ${dep} (${devDeps[dep]})`)
        } else {
            console.log(`  ❌ ${dep} - MISSING`)
            allFilesExist = false
        }
    })

    // Check scripts
    const requiredScripts = ['cypress:open', 'cypress:run', 'e2e', 'e2e:open']
    const scripts = packageJson.scripts || {}

    console.log('\n🚀 Checking npm scripts:')
    requiredScripts.forEach((script) => {
        if (scripts[script]) {
            console.log(`  ✅ ${script}: ${scripts[script]}`)
        } else {
            console.log(`  ❌ ${script} - MISSING`)
            allFilesExist = false
        }
    })
}

// Check Cypress configuration
console.log('\n⚙️  Checking Cypress configuration:')
const cypressConfigPath = path.join(__dirname, '..', 'cypress.config.ts')
if (fs.existsSync(cypressConfigPath)) {
    const configContent = fs.readFileSync(cypressConfigPath, 'utf8')

    // Check for required configuration elements
    const requiredConfigs = [
        'baseUrl',
        'supportFile',
        'specPattern',
        'viewportWidth',
        'viewportHeight'
    ]

    requiredConfigs.forEach((config) => {
        if (configContent.includes(config)) {
            console.log(`  ✅ ${config} configured`)
        } else {
            console.log(`  ❌ ${config} - MISSING`)
            allFilesExist = false
        }
    })
}

// Check test fixtures
console.log('\n🎯 Checking test fixtures:')
const fixturesPath = path.join(
    __dirname,
    '..',
    'cypress',
    'fixtures',
    'sample-decklists.json'
)
if (fs.existsSync(fixturesPath)) {
    try {
        const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'))
        const expectedFixtures = ['basicLands', 'mixedDeck', 'withSideboard']

        expectedFixtures.forEach((fixture) => {
            if (fixtures[fixture]) {
                console.log(`  ✅ ${fixture} fixture exists`)
            } else {
                console.log(`  ❌ ${fixture} fixture - MISSING`)
                allFilesExist = false
            }
        })
    } catch (_error) {
        console.log(`  ❌ Invalid JSON in fixtures file`)
        allFilesExist = false
    }
}

// Summary
console.log('\n' + '='.repeat(50))
if (allFilesExist) {
    console.log('🎉 All Cypress E2E setup validation checks passed!')
    console.log('\n📚 Next steps:')
    console.log('  1. Install Cypress binary: npx cypress install')
    console.log('  2. Start dev server: npm run dev')
    console.log('  3. Run E2E tests: npm run e2e:open')
    console.log('  4. Or run headless: npm run e2e')
    process.exit(0)
} else {
    console.log(
        '❌ Some validation checks failed. Please review the missing items above.'
    )
    process.exit(1)
}
