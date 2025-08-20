#!/usr/bin/env node

/**
 * Simple test to verify Digital Ocean Spaces integration works
 * 
 * Setup:
 * 1. Create a DigitalOcean Space
 * 2. Get access keys
 * 3. Set environment variables:
 *    export DO_SPACES_BUCKET=your-bucket-name
 *    export DO_SPACES_REGION=nyc3
 *    export DO_SPACES_ACCESS_KEY=your-access-key
 *    export DO_SPACES_SECRET_KEY=your-secret-key
 * 4. Run: node simple-test.js
 */

async function testDigitalOceanSpaces() {
    console.log('Testing Digital Ocean Spaces integration...\n');
    
    // Check required environment variables
    const required = ['DO_SPACES_BUCKET', 'DO_SPACES_REGION', 'DO_SPACES_ACCESS_KEY', 'DO_SPACES_SECRET_KEY'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
        console.log('❌ Missing environment variables:', missing.join(', '));
        console.log('\nSetup required:');
        console.log('export DO_SPACES_BUCKET=your-bucket-name');
        console.log('export DO_SPACES_REGION=nyc3');
        console.log('export DO_SPACES_ACCESS_KEY=your-access-key');
        console.log('export DO_SPACES_SECRET_KEY=your-secret-key');
        process.exit(1);
    }
    
    try {
        // Import the storage strategy
        const { configureDigitalOceanSpacesAssetStorage } = require('./dist/digital-ocean-spaces-asset-storage-strategy');
        
        // Create storage strategy
        const storageFactory = configureDigitalOceanSpacesAssetStorage({
            bucket: process.env.DO_SPACES_BUCKET,
            region: process.env.DO_SPACES_REGION,
            credentials: {
                accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
                secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
            },
        });
        
        const strategy = storageFactory({ route: 'assets' });
        
        // Initialize the strategy (connects to DigitalOcean)
        await strategy.init();
        console.log('✅ Connected to DigitalOcean Spaces');
        
        // Test basic file operations
        const testFile = 'test.txt';
        const testContent = Buffer.from('Hello from Vendure + DigitalOcean Spaces!');
        
        // Upload
        const identifier = await strategy.writeFileFromBuffer(testFile, testContent);
        console.log('✅ File uploaded:', identifier);
        
        // Check exists
        const exists = await strategy.fileExists(identifier);
        console.log('✅ File exists:', exists);
        
        // Download
        const downloaded = await strategy.readFileToBuffer(identifier);
        console.log('✅ File downloaded, content matches:', downloaded.equals(testContent));
        
        // Clean up
        await strategy.deleteFile(identifier);
        console.log('✅ File deleted');
        
        console.log('\n🎉 Digital Ocean Spaces integration works!');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDigitalOceanSpaces();