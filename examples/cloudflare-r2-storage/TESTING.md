# Testing Guide: CloudFlare R2 Storage Integration

This guide provides comprehensive testing instructions for the CloudFlare R2 digital storage integration with Vendure. Follow these steps to validate that the implementation works correctly in various scenarios.

## Test Levels

### 1. 🏗️ Build and Lint Testing (Required)

**Purpose**: Validates TypeScript compilation and code quality standards.

```bash
# Navigate to the example directory
cd examples/cloudflare-r2-storage

# Test TypeScript compilation
npm run build

# Verify no TypeScript errors (if tsc is available)
npx tsc --noEmit

# Check for any immediate syntax or import issues
node -c dist/index.js
```

**Expected Results**:
- ✅ No TypeScript compilation errors
- ✅ All imports resolve correctly
- ✅ Generated JavaScript is valid
- ✅ No `any` types in the implementation

**Common Issues**:
- Missing AWS SDK dependencies → Run `npm install`
- Module resolution errors → Check `tsconfig.json` and import paths
- Type errors → Verify all CloudFlare R2 types are properly defined

### 2. 🔧 Plugin Integration Testing (Required)

**Purpose**: Tests that the CloudFlare R2 plugin loads and integrates with Vendure core.

```bash
# Test without R2 configuration (should use local storage fallback)
npm run dev:server

# Check server logs for successful startup
# Expected: No R2-related errors, fallback to local storage
```

**Expected Results**:
- ✅ Vendure server starts without errors
- ✅ AssetServerPlugin initializes successfully
- ✅ Admin UI accessible at http://localhost:3000/admin
- ✅ Asset upload functionality works (using local storage)

**Test Scenarios**:

#### A. Local Storage Fallback (No R2 Configuration)
```bash
# Clear any R2 environment variables
unset CLOUDFLARE_ACCOUNT_ID
unset CLOUDFLARE_R2_ACCESS_KEY_ID
unset CLOUDFLARE_R2_SECRET_ACCESS_KEY

# Start server
npm run dev:server
```

#### B. Invalid R2 Configuration
```bash
# Set invalid credentials to test error handling
export CLOUDFLARE_ACCOUNT_ID="invalid-account-id"
export CLOUDFLARE_R2_ACCESS_KEY_ID="invalid-key"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="invalid-secret"
export CLOUDFLARE_R2_BUCKET="test-bucket"

# Start server (should show clear error messages)
npm run dev:server
```

**Expected Error Messages**:
```
[CloudFlareR2AssetStorageStrategy] Error: Failed to upload file to CloudFlare R2: Credentials invalid
```

### 3. 🧪 Functional Testing (CloudFlare R2 Specific)

**Purpose**: Tests actual CloudFlare R2 storage operations with real credentials.

**Prerequisites**:
- Valid CloudFlare account with R2 enabled
- R2 bucket created
- API tokens generated
- Environment variables configured

#### Setup Test Environment

1. **Create Test Bucket**:
```bash
# Using CloudFlare CLI
wrangler r2 bucket create vendure-test-assets

# Or use CloudFlare dashboard
```

2. **Configure Environment**:
```bash
# Create .env file with test credentials
cp .env.example .env

# Edit .env with your test CloudFlare R2 credentials
CLOUDFLARE_ACCOUNT_ID=your-test-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-test-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-test-secret-key
CLOUDFLARE_R2_BUCKET=vendure-test-assets
CLOUDFLARE_R2_REGION=auto
CLOUDFLARE_R2_USE_HTTPS=true
```

#### Test Asset Upload Flow

**Step 1: Start Server with R2 Configuration**
```bash
npm run dev:server
```

**Step 2: Access Admin UI**
```bash
# Open browser to
http://localhost:3000/admin

# Login with default credentials:
# Username: superadmin
# Password: superadmin
```

**Step 3: Test Asset Upload**
1. Navigate to **Catalog** → **Assets**
2. Click **Upload Assets**
3. Select a test image file (JPG, PNG, WebP)
4. Upload the file

**Expected Results**:
- ✅ File uploads successfully
- ✅ File appears in asset list
- ✅ Asset preview loads correctly
- ✅ File is stored in CloudFlare R2 bucket
- ✅ Asset URL points to R2 (check browser network tab)

**Step 4: Verify R2 Storage**
```bash
# List objects in R2 bucket
wrangler r2 object list vendure-test-assets

# Should show uploaded files
```

#### Test Asset Serving

**Test Asset URL Access**:
1. Copy asset URL from Vendure admin
2. Open URL in new browser tab
3. Verify image loads correctly

**Test Different Asset Types**:
- Upload JPG image
- Upload PNG image  
- Upload PDF document
- Upload any other supported file type

**Expected Results**:
- ✅ All file types upload successfully
- ✅ Correct MIME types are set in R2
- ✅ Files are accessible via generated URLs
- ✅ Content-Type headers are correct

#### Test Asset Deletion

1. **Delete Asset from Admin UI**:
   - Select an asset in the admin
   - Click delete
   - Confirm deletion

2. **Verify R2 Cleanup**:
```bash
# Check that file was removed from R2
wrangler r2 object list vendure-test-assets
```

**Expected Results**:
- ✅ Asset removed from Vendure database
- ✅ File deleted from CloudFlare R2 bucket
- ✅ Asset URL returns 404

### 4. 📋 Configuration Testing

**Purpose**: Tests various configuration scenarios and environment setups.

#### Test Configuration Validation

**Valid Configuration**:
```bash
# Test with complete, valid configuration
export CLOUDFLARE_ACCOUNT_ID="valid-account-id"
export CLOUDFLARE_R2_ACCESS_KEY_ID="valid-key"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="valid-secret"
export CLOUDFLARE_R2_BUCKET="test-bucket"

npm run dev:server
```

**Missing Account ID**:
```bash
unset CLOUDFLARE_ACCOUNT_ID
npm run dev:server
# Should fall back to local storage, no errors
```

**Invalid Credentials**:
```bash
export CLOUDFLARE_ACCOUNT_ID="invalid"
export CLOUDFLARE_R2_ACCESS_KEY_ID="invalid"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="invalid"

npm run dev:server
# Should show clear error on first upload attempt
```

#### Test Custom Domain Configuration

**Without Custom Domain**:
```bash
unset CLOUDFLARE_R2_CUSTOM_DOMAIN
npm run dev:server
# Asset URLs should use R2 endpoint
```

**With Custom Domain**:
```bash
export CLOUDFLARE_R2_CUSTOM_DOMAIN="assets.example.com"
npm run dev:server
# Asset URLs should use custom domain
```

#### Test HTTPS Configuration

**Force HTTPS (default)**:
```bash
export CLOUDFLARE_R2_USE_HTTPS=true
# Asset URLs should use https://
```

**Allow HTTP**:
```bash
export CLOUDFLARE_R2_USE_HTTPS=false
# Asset URLs should use http:// (not recommended for production)
```

### 5. 🌐 End-to-End Testing

**Purpose**: Tests complete workflows in realistic scenarios.

#### E2E Test: Product with Images

**Step 1: Create Product**
1. Go to **Catalog** → **Products**
2. Click **Create Product**
3. Fill in product details
4. Upload product images via asset selection

**Step 2: Verify Frontend**
1. Access Shop API at http://localhost:3000/shop-api
2. Query for the product with assets
3. Verify asset URLs are accessible

**GraphQL Query Example**:
```graphql
query GetProduct($slug: String!) {
  product(slug: $slug) {
    id
    name
    featuredAsset {
      source
      preview
    }
    assets {
      source
      preview
    }
  }
}
```

**Expected Results**:
- ✅ Product images load from CloudFlare R2
- ✅ Image URLs return correct content-type headers
- ✅ Images display correctly in admin UI
- ✅ API responses include correct asset URLs

#### E2E Test: Asset Processing Pipeline

**Test Image Variants**:
1. Upload large image (> 2MB)
2. Check that thumbnails are generated
3. Test image transformations via URL parameters

**Example URL Tests**:
```bash
# Original image
https://your-r2-bucket.account-id.r2.cloudflarestorage.com/image.jpg

# Thumbnail variant
https://your-r2-bucket.account-id.r2.cloudflarestorage.com/image_thumbnail.jpg

# Check that variants exist in R2
wrangler r2 object list vendure-test-assets
```

### 6. ⚡ Performance Testing

**Purpose**: Validates performance characteristics of R2 integration.

#### Upload Performance Test

**Test Large File Upload**:
```bash
# Create test file
dd if=/dev/zero of=test-large-file.jpg bs=1M count=10

# Upload via admin UI and measure time
# Should complete within reasonable time limits
```

**Test Concurrent Uploads**:
1. Upload multiple files simultaneously
2. Monitor server performance
3. Check for any timeout or memory issues

#### Download Performance Test

**Test Asset Serving Speed**:
```bash
# Use curl to test download speeds
curl -w "@curl-format.txt" -o /dev/null -s "ASSET_URL"

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```

**Expected Performance**:
- ✅ Upload times comparable to local storage
- ✅ Download speeds benefit from CloudFlare CDN
- ✅ No memory leaks during large uploads
- ✅ Concurrent operations handle properly

### 7. 🛡️ Security Testing

**Purpose**: Validates security aspects of the R2 integration.

#### Test Access Control

**Test Invalid Token Access**:
```bash
# Use expired or invalid token
export CLOUDFLARE_R2_ACCESS_KEY_ID="expired-token"
# Upload should fail with authentication error
```

**Test Bucket Access**:
```bash
# Try accessing non-existent bucket
export CLOUDFLARE_R2_BUCKET="non-existent-bucket"
# Operations should fail gracefully
```

#### Test URL Security

**Test Direct R2 Access**:
1. Get asset URL from admin
2. Verify public access works as expected
3. Check that private assets remain private (if configured)

**Test Asset URL Patterns**:
- Verify URLs don't expose sensitive information
- Check that asset identifiers are properly formed
- Ensure HTTPS is used in production

### Troubleshooting

#### Common Test Failures

**1. Build Failures**
```bash
Error: Cannot find module '@aws-sdk/client-s3'
```
**Solution**: Run `npm install` to ensure dependencies are installed

**2. Configuration Errors**
```bash
Error: CloudFlare Account ID is required
```
**Solution**: Check environment variables are set correctly

**3. Network Errors**
```bash
Error: Failed to upload file to CloudFlare R2: Network timeout
```
**Solution**: Check internet connection and CloudFlare service status

**4. Permission Errors**
```bash
Error: Access denied to R2 bucket
```
**Solution**: Verify API token permissions in CloudFlare dashboard

#### Debug Commands

**Enable Debug Logging**:
```bash
DEBUG=CloudFlareR2AssetStorageStrategy npm run dev:server
```

**Check Environment Variables**:
```bash
env | grep CLOUDFLARE
```

**Test R2 Connectivity**:
```bash
# Test basic R2 access with CloudFlare CLI
wrangler r2 bucket list
```

### Test Environment Cleanup

**After Testing**:

1. **Clean up test assets**:
```bash
# Remove test files from R2
wrangler r2 object delete vendure-test-assets test-file.jpg

# Or delete entire test bucket
wrangler r2 bucket delete vendure-test-assets
```

2. **Reset environment**:
```bash
# Clear test environment variables
unset CLOUDFLARE_ACCOUNT_ID
unset CLOUDFLARE_R2_ACCESS_KEY_ID
unset CLOUDFLARE_R2_SECRET_ACCESS_KEY
unset CLOUDFLARE_R2_BUCKET
```

3. **Clean local files**:
```bash
# Remove generated files
rm -rf dist/
rm -f test-*.jpg
```

### Success Criteria

The CloudFlare R2 integration passes testing when:

- ✅ **Build and TypeScript compilation** work without errors
- ✅ **Plugin loads and integrates** with Vendure core successfully  
- ✅ **Asset uploads** work with both local storage fallback and R2
- ✅ **Asset serving** provides correct URLs and file access
- ✅ **Asset deletion** removes files from both Vendure and R2
- ✅ **Configuration validation** provides clear error messages
- ✅ **Performance** meets acceptable standards for upload/download
- ✅ **Security** controls work as expected
- ✅ **Error handling** is robust and informative

### Continuous Testing

**Automated Test Script**:

Create a test script for regular validation:

```bash
#!/bin/bash
# test-r2-integration.sh

echo "Testing CloudFlare R2 Integration..."

# 1. Build test
echo "1. Testing build..."
npm run build || exit 1

# 2. Syntax test
echo "2. Testing JavaScript syntax..."
node -c dist/index.js || exit 1

# 3. Local storage fallback test
echo "3. Testing local storage fallback..."
unset CLOUDFLARE_ACCOUNT_ID
timeout 30 npm run dev:server &
sleep 5
kill %1

# 4. Configuration validation test
echo "4. Testing configuration validation..."
export CLOUDFLARE_ACCOUNT_ID="test"
timeout 30 npm run dev:server &
sleep 5
kill %1

echo "All tests passed! ✅"
```

This comprehensive testing guide ensures the CloudFlare R2 integration is robust, secure, and production-ready.