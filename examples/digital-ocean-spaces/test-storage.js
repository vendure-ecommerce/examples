#!/usr/bin/env node

/**
 * Simple test script for DigitalOcean Spaces storage strategy
 * 
 * Usage:
 * 1. Set up your .env file with real DigitalOcean Spaces credentials
 * 2. Run: node test-storage.js
 */

require('dotenv').config();

async function testStorageStrategy() {
    console.log('🧪 Testing DigitalOcean Spaces Storage Strategy...\n');
    
    // Test 1: Check environment variables
    console.log('1️⃣ Checking environment configuration:');
    const requiredVars = {
        'APP_ENV': process.env.APP_ENV,
        'DO_SPACES_BUCKET': process.env.DO_SPACES_BUCKET,
        'DO_SPACES_REGION': process.env.DO_SPACES_REGION,
        'DO_SPACES_ACCESS_KEY': process.env.DO_SPACES_ACCESS_KEY ? '***REDACTED***' : undefined,
        'DO_SPACES_SECRET_KEY': process.env.DO_SPACES_SECRET_KEY ? '***REDACTED***' : undefined,
    };
    
    let envOk = true;
    for (const [key, value] of Object.entries(requiredVars)) {
        if (process.env.APP_ENV === 'production' && !value) {
            console.log(`   ❌ ${key}: missing`);
            envOk = false;
        } else {
            console.log(`   ✅ ${key}: ${value || 'not set (ok for dev mode)'}`);
        }
    }
    
    if (!envOk) {
        console.log('\n❌ Environment configuration incomplete. Please check your .env file.');
        process.exit(1);
    }
    
    // Test 2: Import the strategy
    console.log('\n2️⃣ Testing module imports:');
    try {
        const { configureDigitalOceanSpacesAssetStorage } = require('./dist/digital-ocean-spaces-asset-storage-strategy');
        console.log('   ✅ DigitalOcean Spaces storage strategy imported successfully');
        
        // Test 3: Create strategy instance
        console.log('\n3️⃣ Testing strategy configuration:');
        const mockOptions = {
            route: 'assets',
            assetUrlPrefix: undefined
        };
        
        if (process.env.APP_ENV === 'production') {
            const storageStrategyFactory = configureDigitalOceanSpacesAssetStorage({
                bucket: process.env.DO_SPACES_BUCKET,
                region: process.env.DO_SPACES_REGION,
                credentials: {
                    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
                    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
                },
            });
            
            const strategy = storageStrategyFactory(mockOptions);
            console.log('   ✅ Storage strategy instance created successfully');
            
            // Test 4: Initialize strategy
            console.log('\n4️⃣ Testing strategy initialization:');
            try {
                await strategy.init();
                console.log('   ✅ Strategy initialized successfully');
                console.log(`   📦 Connected to bucket: ${process.env.DO_SPACES_BUCKET}`);
                console.log(`   🌍 Region: ${process.env.DO_SPACES_REGION}`);
                
                // Test 5: Test basic file operations (optional)
                console.log('\n5️⃣ Testing basic file operations:');
                const testFileName = 'test-file.txt';
                const testContent = Buffer.from('Hello from Vendure + DigitalOcean Spaces!');
                
                try {
                    // Upload test file
                    const identifier = await strategy.writeFileFromBuffer(testFileName, testContent);
                    console.log(`   ✅ File uploaded with identifier: ${identifier}`);
                    
                    // Check if file exists
                    const exists = await strategy.fileExists(identifier);
                    console.log(`   ✅ File exists check: ${exists}`);
                    
                    // Download and verify file
                    const downloadedContent = await strategy.readFileToBuffer(identifier);
                    const contentMatch = downloadedContent.equals(testContent);
                    console.log(`   ✅ File content verification: ${contentMatch}`);
                    
                    // Cleanup test file
                    await strategy.deleteFile(identifier);
                    console.log(`   ✅ Test file cleaned up`);
                    
                } catch (fileOpError) {
                    console.log(`   ⚠️  File operations test failed: ${fileOpError.message}`);
                    console.log('   (This might be due to permissions or bucket configuration)');
                }
                
            } catch (initError) {
                console.log(`   ❌ Strategy initialization failed: ${initError.message}`);
                console.log('   Check your credentials and bucket configuration.');
            }
        } else {
            console.log('   ℹ️  Skipping DigitalOcean Spaces tests (APP_ENV=dev)');
        }
        
        console.log('\n🎉 Tests completed!');
        
    } catch (importError) {
        console.log(`   ❌ Import failed: ${importError.message}`);
        console.log('   Make sure to run "npm run build" first.');
        process.exit(1);
    }
}

testStorageStrategy().catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});