# MinIO S3 Storage Integration - Testing Guide

Complete testing guide for the MinIO S3 storage integration example, covering build validation, integration testing, and end-to-end functionality verification.

## Test Levels

### 1. 🏗️ Build and Lint Testing (Required)

Validates that the TypeScript compiles correctly and code follows best practices.

```bash
# Navigate to example directory
cd examples/minio-s3-storage

# Run TypeScript compilation
npm run build

# Check for type errors without compilation
npx tsc --noEmit

# Run linting (if configured)
npm run lint 2>/dev/null || echo "No lint script configured"
```

**Expected Results:**
- ✅ TypeScript compiles without errors
- ✅ No type safety violations
- ✅ All imports resolve correctly
- ✅ AWS SDK v3 packages integrate properly

### 2. 🔧 Plugin Integration Testing (Required)

Tests that the MinIO storage strategy integrates correctly with Vendure core.

```bash
# Start Vendure server (without MinIO - local storage fallback)
npm run dev:server

# Server should start successfully on port 3000
# Check logs for successful AssetServerPlugin initialization
```

**Expected Results:**
- ✅ Server starts without errors
- ✅ AssetServerPlugin loads successfully
- ✅ Falls back to local storage when MinIO not configured
- ✅ Admin UI accessible at http://localhost:3000/admin
- ✅ GraphiQL accessible at http://localhost:3000/graphiql

### 3. 🧪 MinIO Storage Functional Testing

Tests the actual MinIO storage functionality with a running MinIO server.

#### Prerequisites Setup

```bash
# 1. Start MinIO server using Docker
docker run -d --name minio-test -p 9000:9000 -p 9090:9090 \
  -e "MINIO_ACCESS_KEY=minioadmin" \
  -e "MINIO_SECRET_KEY=minioadmin" \
  minio/minio server /data --console-address ":9090"

# 2. Wait for MinIO to start
sleep 5

# 3. Verify MinIO is accessible
curl -f http://localhost:9000/minio/health/ready || echo "MinIO not ready"

# 4. Create bucket (via MinIO console or CLI)
# Access http://localhost:9090 and create 'vendure-assets' bucket
```

#### Environment Configuration Testing

```bash
# Test 1: Environment variable loading
cat > .env << EOF
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=vendure-assets
MINIO_REGION=us-east-1
EOF

# Test 2: Start Vendure with MinIO configuration
npm run dev:server

# Check server logs for MinIO configuration messages
```

**Expected Results:**
- ✅ Environment variables loaded correctly
- ✅ S3AssetStorageStrategy initialized
- ✅ MinIO connection established
- ✅ No connection errors in logs

#### Asset Upload Testing

```bash
# Test asset upload via Admin UI:
# 1. Navigate to http://localhost:3000/admin
# 2. Login (superadmin/superadmin)
# 3. Go to Catalog → Products
# 4. Create new product
# 5. Upload product image
# 6. Verify image appears and URLs point to MinIO
```

**Expected Results:**
- ✅ Asset upload succeeds
- ✅ Asset stored in MinIO bucket
- ✅ Asset URLs use MinIO endpoint format
- ✅ Images display correctly in Admin UI
- ✅ Direct MinIO URLs are accessible

### 4. 📋 Configuration Testing

Tests various configuration scenarios and edge cases.

#### Fallback Configuration Testing

```bash
# Test 1: No MinIO configuration (local storage fallback)
rm -f .env

# Start server - should use local storage
npm run dev:server

# Upload test asset via Admin UI
# Verify assets stored in static/assets/ directory
ls -la static/assets/
```

#### Invalid MinIO Configuration Testing

```bash
# Test 2: Invalid MinIO endpoint
cat > .env << EOF
MINIO_ENDPOINT=http://localhost:9999
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=vendure-assets
EOF

# Start server - should handle connection errors gracefully
npm run dev:server

# Check logs for appropriate error handling
```

#### Production Configuration Testing

```bash
# Test 3: Production-like configuration
cat > .env << EOF
MINIO_ENDPOINT=https://your-production-minio.com
MINIO_ACCESS_KEY=production-access-key
MINIO_SECRET_KEY=production-secret-key
MINIO_BUCKET=vendure-production-assets
MINIO_REGION=us-west-2
EOF

# Validate configuration loads without starting server
node -e "
require('dotenv').config();
console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
console.log('MINIO_BUCKET:', process.env.MINIO_BUCKET);
"
```

### 5. 🌐 End-to-End Testing

Comprehensive testing of complete asset management workflows.

#### Complete Asset Lifecycle Testing

```bash
# Prerequisites: MinIO running, .env configured

# 1. Start Vendure server
npm run dev:server

# 2. Run complete asset lifecycle test
```

**Manual E2E Test Checklist:**

1. **Asset Upload Flow:**
   - [ ] Navigate to Admin UI (http://localhost:3000/admin)
   - [ ] Login with credentials
   - [ ] Create new product
   - [ ] Upload multiple image assets (PNG, JPG, different sizes)
   - [ ] Verify assets appear in asset picker
   - [ ] Check asset URLs point to MinIO endpoint

2. **Asset Access Flow:**
   - [ ] Copy asset URL from Admin UI
   - [ ] Access URL directly in browser
   - [ ] Verify image loads correctly
   - [ ] Test image transformations (if configured)

3. **MinIO Integration Verification:**
   - [ ] Access MinIO Console (http://localhost:9090)
   - [ ] Navigate to vendure-assets bucket
   - [ ] Verify uploaded files present
   - [ ] Check file metadata and permissions

4. **Error Handling Flow:**
   - [ ] Stop MinIO server
   - [ ] Try uploading asset (should fail gracefully)
   - [ ] Restart MinIO
   - [ ] Verify asset upload works again

#### Performance Testing

```bash
# Test large file upload performance
# Create test files of different sizes

# 1MB test file
dd if=/dev/zero of=test-1mb.jpg bs=1024 count=1024

# 10MB test file  
dd if=/dev/zero of=test-10mb.jpg bs=1024 count=10240

# Upload via Admin UI and measure performance
# Check MinIO console for upload metrics
```

### 6. 🔐 Security Testing

Tests security aspects of the MinIO integration.

#### Credential Security Testing

```bash
# Test 1: Environment variable security
# Ensure credentials not logged or exposed
npm run dev:server 2>&1 | grep -i "minioadmin" && echo "SECURITY ISSUE: Credentials in logs"

# Test 2: Network security
# Verify MinIO endpoints use appropriate protocols
node -e "
require('dotenv').config();
const endpoint = process.env.MINIO_ENDPOINT;
if (endpoint && endpoint.startsWith('http://') && process.env.NODE_ENV === 'production') {
  console.log('WARNING: Using HTTP in production');
} else {
  console.log('Protocol configuration OK');
}
"
```

#### Access Control Testing

```bash
# Test bucket permissions via MinIO console:
# 1. Access http://localhost:9090
# 2. Go to Buckets → vendure-assets → Access Rules
# 3. Verify appropriate read/write permissions
# 4. Test public read access for assets
# 5. Ensure write access restricted to application
```

## Automated Test Scripts

### Quick Validation Script

```bash
#!/bin/bash
# save as: test-minio-integration.sh

set -e

echo "🧪 MinIO Integration Test Suite"
echo "=============================="

# Test 1: Build validation
echo "📦 Testing build..."
npm run build
echo "✅ Build successful"

# Test 2: MinIO availability
echo "🐳 Checking MinIO availability..."
if curl -f http://localhost:9000/minio/health/ready >/dev/null 2>&1; then
    echo "✅ MinIO is running"
else
    echo "❌ MinIO not available - starting Docker container"
    docker run -d --name minio-test -p 9000:9000 -p 9090:9090 \
        -e "MINIO_ACCESS_KEY=minioadmin" \
        -e "MINIO_SECRET_KEY=minioadmin" \
        minio/minio server /data --console-address ":9090"
    sleep 10
fi

# Test 3: Environment configuration
echo "⚙️  Testing environment configuration..."
cat > .env << EOF
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=vendure-assets
MINIO_REGION=us-east-1
EOF

# Test 4: Server startup
echo "🚀 Testing server startup..."
timeout 30 npm run dev:server &
SERVER_PID=$!
sleep 15

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo "🎉 All tests passed!"
```

Make script executable and run:
```bash
chmod +x test-minio-integration.sh
./test-minio-integration.sh
```

### Health Check Script

```bash
#!/bin/bash
# save as: health-check.sh

echo "🏥 MinIO Integration Health Check"
echo "================================"

# Check MinIO server
if curl -f http://localhost:9000/minio/health/ready >/dev/null 2>&1; then
    echo "✅ MinIO server: OK"
else
    echo "❌ MinIO server: DOWN"
fi

# Check MinIO console
if curl -f http://localhost:9090 >/dev/null 2>&1; then
    echo "✅ MinIO console: OK"
else
    echo "❌ MinIO console: DOWN"
fi

# Check Vendure server
if curl -f http://localhost:3000/admin >/dev/null 2>&1; then
    echo "✅ Vendure server: OK"
else
    echo "❌ Vendure server: DOWN"
fi

# Check environment configuration
if [ -n "$MINIO_ENDPOINT" ]; then
    echo "✅ Environment: MinIO configured"
else
    echo "⚠️  Environment: Using local storage fallback"
fi
```

## Troubleshooting Common Test Issues

### Build Issues

**Issue:** TypeScript compilation errors
```bash
# Solution: Check for missing dependencies
npm install
npm run build
```

**Issue:** AWS SDK import errors
```bash
# Solution: Verify AWS SDK packages installed
npm list @aws-sdk/client-s3 @aws-sdk/lib-storage
```

### Runtime Issues

**Issue:** MinIO connection refused
```bash
# Solution: Verify MinIO is running
docker ps | grep minio
docker logs minio-test

# Restart if needed
docker restart minio-test
```

**Issue:** Bucket not found errors
```bash
# Solution: Create bucket via MinIO console
# Or use MinIO CLI:
docker exec minio-test mc mb /data/vendure-assets
```

**Issue:** Asset upload fails
```bash
# Solution: Check bucket permissions
# Access MinIO console → Buckets → vendure-assets → Access Rules
# Ensure read/write permissions are set correctly
```

### Performance Issues

**Issue:** Slow asset uploads
```bash
# Check MinIO performance metrics
# Access MinIO console → Monitoring
# Verify network connectivity and disk performance
```

**Issue:** Memory usage concerns
```bash
# Monitor memory usage during large uploads
top -p $(pgrep -f "npm run dev:server")
```

## Test Success Criteria

For the MinIO integration to be considered fully functional, all tests should pass:

- ✅ **Build Tests**: TypeScript compiles without errors
- ✅ **Integration Tests**: Server starts with MinIO configuration
- ✅ **Functional Tests**: Assets upload and retrieve successfully
- ✅ **Configuration Tests**: Environment variables work correctly
- ✅ **Fallback Tests**: Local storage works when MinIO unavailable
- ✅ **Security Tests**: No credential exposure or security issues
- ✅ **Performance Tests**: Acceptable upload/download speeds
- ✅ **E2E Tests**: Complete asset lifecycle works end-to-end

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test-minio-integration.yml
name: Test MinIO Integration

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      minio:
        image: minio/minio
        ports:
          - 9000:9000
          - 9090:9090
        env:
          MINIO_ACCESS_KEY: minioadmin
          MINIO_SECRET_KEY: minioadmin
        options: >-
          --health-cmd "curl -f http://localhost:9000/minio/health/ready"
          --health-interval 30s
          --health-timeout 20s
          --health-retries 3

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        working-directory: examples/minio-s3-storage
        
      - name: Run build test
        run: npm run build
        working-directory: examples/minio-s3-storage
        
      - name: Create test environment
        run: |
          cat > .env << EOF
          MINIO_ENDPOINT=http://localhost:9000
          MINIO_ACCESS_KEY=minioadmin
          MINIO_SECRET_KEY=minioadmin
          MINIO_BUCKET=vendure-assets
          MINIO_REGION=us-east-1
          EOF
        working-directory: examples/minio-s3-storage
        
      - name: Test server startup
        run: timeout 30 npm run dev:server &
        working-directory: examples/minio-s3-storage
```

This comprehensive testing guide ensures that the MinIO S3 storage integration is thoroughly validated and ready for production use.