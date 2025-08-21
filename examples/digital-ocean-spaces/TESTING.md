# Testing Guide for DigitalOcean Spaces Integration

## Overview

This guide provides multiple ways to test the DigitalOcean Spaces integration, from basic local testing to full production testing with real DigitalOcean infrastructure.

## Prerequisites

- Node.js and npm installed
- Basic familiarity with Vendure
- (For production testing) DigitalOcean account with Spaces enabled

## Test Levels

### 1. 🏗️ Build and Import Testing (No external dependencies)

Test that the code compiles and modules load correctly:

```bash
# Navigate to the example directory
cd examples/examples/digital-ocean-spaces

# Install dependencies
npm install

# Test TypeScript compilation
npm run build

# Test basic module imports and configuration
node test-storage.js
```

**Expected Output:**
- ✅ All imports successful
- ✅ Environment configuration loaded
- ✅ Strategy factory creates instances

### 2. 🖥️ Local Development Testing (File system storage)

Test Vendure functionality with local file storage:

```bash
# Ensure APP_ENV is set to dev in .env file
echo "APP_ENV=dev" > .env
echo "SUPERADMIN_USERNAME=superadmin" >> .env
echo "SUPERADMIN_PASSWORD=superadmin" >> .env
echo "COOKIE_SECRET=test-cookie-secret" >> .env

# Start the development server
npm run dev:server
```

**What to test:**
1. Server starts without errors
2. Admin UI loads at http://localhost:3002
3. Log in with superadmin/superadmin
4. Upload assets in Catalog → Assets
5. Assets are stored in `static/assets/` directory
6. Assets display correctly in the admin

### 3. 🔧 Configuration Testing (Mock production mode)

Test production configuration without actual DigitalOcean connection:

```bash
# Create production config with mock values
cat > .env << 'EOF'
APP_ENV=production
DO_SPACES_BUCKET=test-bucket
DO_SPACES_REGION=nyc3
DO_SPACES_ACCESS_KEY=mock-access-key
DO_SPACES_SECRET_KEY=mock-secret-key
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
COOKIE_SECRET=test-cookie-secret
EOF

# Run tests (will show configuration loading)
node test-storage.js

# Try starting server (will fail at AWS connection but shows config loading)
timeout 10s npm run dev:server || true
```

**Expected Behavior:**
- Configuration loads correctly
- AWS SDK modules import successfully
- Connection fails gracefully with clear error messages

### 4. ☁️ Full Integration Testing (Real DigitalOcean Spaces)

#### Step 4.1: DigitalOcean Setup

1. **Create DigitalOcean Account**: Sign up at https://digitalocean.com
2. **Create a Space**:
   - Go to Spaces in the DO control panel
   - Click "Create a Space"
   - Choose a region (e.g., `nyc3`)
   - Give it a unique name (e.g., `my-vendure-assets-test`)
   - Set to Private (default)
3. **Generate API Keys**:
   - Go to API → Spaces access keys
   - Click "Generate New Key"
   - Note down Access Key ID and Secret Key

#### Step 4.2: Environment Configuration

```bash
# Update .env with your real DigitalOcean credentials
cat > .env << 'EOF'
APP_ENV=production
DO_SPACES_BUCKET=your-actual-space-name
DO_SPACES_REGION=nyc3
DO_SPACES_ACCESS_KEY=your-actual-access-key
DO_SPACES_SECRET_KEY=your-actual-secret-key
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
COOKIE_SECRET=your-cookie-secret
EOF
```

#### Step 4.3: Run Integration Tests

```bash
# Test the storage strategy directly
node test-storage.js

# Start the full Vendure server
npm run dev:server
```

**What to test:**
1. **Storage Strategy Test**: `node test-storage.js` should show:
   - ✅ Configuration loaded
   - ✅ Strategy initialized
   - ✅ Bucket connection successful
   - ✅ File upload/download/delete operations work

2. **Vendure Server Test**: Server starts and shows:
   - No DigitalOcean-related errors in logs
   - Admin UI accessible
   - Asset uploads work end-to-end

#### Step 4.4: End-to-End Asset Testing

1. **Admin UI Testing**:
   - Open http://localhost:3002
   - Login with your credentials
   - Go to Catalog → Assets
   - Upload various file types (images, PDFs)
   - Verify uploads appear in DigitalOcean Space

2. **DigitalOcean Console Verification**:
   - Log into DigitalOcean control panel
   - Navigate to your Space
   - Verify uploaded files appear in the bucket
   - Check file sizes and timestamps

3. **Asset Serving Testing**:
   - Note the asset URLs from Vendure admin
   - Access them directly in browser
   - Should serve from DigitalOcean (check network dev tools)

### 5. 🌐 CDN Testing (Optional)

Test DigitalOcean's built-in CDN:

#### Step 5.1: Enable CDN
1. In DigitalOcean control panel
2. Go to your Space → Settings
3. Enable "Serve files via CDN"
4. Note your CDN endpoint URL

#### Step 5.2: Update Configuration
```bash
# Add CDN endpoint to .env
echo "ASSET_URL_PREFIX=https://your-space-name.nyc3.cdn.digitaloceanspaces.com/" >> .env

# Restart server
npm run dev:server
```

#### Step 5.3: Verify CDN Serving
- Upload new assets via admin
- Check that asset URLs now use CDN domain
- Test asset loading speed from different geographic locations

## Troubleshooting

### Common Issues and Solutions

#### 1. **"Cannot find module '@aws-sdk/client-s3'"**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

#### 2. **"Access Denied" errors**
- Verify your DigitalOcean Spaces access keys
- Check that the user has read/write permissions for Spaces
- Ensure the bucket name exists and is correct

#### 3. **"Bucket not found" errors**
- The storage strategy will try to create the bucket automatically
- Ensure the bucket name is globally unique
- Check that the region in config matches your Space's region

#### 4. **CORS errors when accessing assets**
- Configure CORS in DigitalOcean Space settings
- Add your domains to allowed origins
- Include necessary headers (GET, PUT, POST, DELETE)

#### 5. **Assets not displaying in admin**
- Check `ASSET_URL_PREFIX` configuration
- Verify the Space is configured for public read access if needed
- Check browser network tab for failed requests

### Debug Logging

Enable verbose logging to diagnose issues:

```typescript
// In vendure-config.ts, add:
import { DefaultLogger, LogLevel } from '@vendure/core';

export const config: VendureConfig = {
  // ... other config
  logger: new DefaultLogger({ level: LogLevel.Verbose }),
  // ... rest of config
};
```

This will show detailed logs for:
- Asset storage strategy initialization
- S3 client operations
- Bucket creation attempts
- File upload/download operations

### Performance Testing

Test with larger files and concurrent uploads:

```bash
# Upload large images (>10MB) via admin UI
# Upload multiple files simultaneously
# Monitor DigitalOcean bandwidth usage
# Test from different geographic locations
```

## Test Checklist

Use this checklist to ensure comprehensive testing:

### Basic Functionality
- [ ] Code compiles without TypeScript errors
- [ ] Dependencies install correctly
- [ ] Server starts in development mode
- [ ] Server starts in production mode
- [ ] Admin UI accessible and functional

### Storage Operations
- [ ] File upload to DigitalOcean Spaces works
- [ ] File download from DigitalOcean Spaces works
- [ ] File deletion works
- [ ] File existence check works
- [ ] Large file uploads (>10MB) work
- [ ] Multiple concurrent uploads work

### Integration
- [ ] Assets display correctly in Vendure admin
- [ ] Asset URLs are generated correctly
- [ ] Asset serving works (direct URL access)
- [ ] CDN serving works (if enabled)
- [ ] CORS configured correctly for web access

### Error Handling
- [ ] Graceful handling of invalid credentials
- [ ] Graceful handling of network errors
- [ ] Clear error messages in logs
- [ ] Fallback behavior when service unavailable

### Production Readiness
- [ ] Environment variables properly configured
- [ ] No hardcoded secrets in code
- [ ] Proper error logging
- [ ] Performance acceptable under load
- [ ] Cost monitoring set up in DigitalOcean

## Next Steps

After successful testing:

1. **Set up monitoring**: Configure DigitalOcean monitoring and alerts
2. **Configure CDN**: Enable and test CDN for better performance
3. **Set up lifecycle policies**: Configure automatic cleanup of old assets
4. **Document deployment**: Create deployment procedures for your team
5. **Set up CI/CD**: Automate testing and deployment processes

## Getting Help

If you encounter issues:

1. Check the logs first (`npm run dev:server` with verbose logging)
2. Verify your DigitalOcean configuration in the console
3. Test with the standalone `test-storage.js` script
4. Check the implementation details in `src/memories.md`
5. Review the troubleshooting section above

For DigitalOcean-specific issues, consult:
- [DigitalOcean Spaces Documentation](https://docs.digitalocean.com/products/spaces/)
- [DigitalOcean Community Forums](https://www.digitalocean.com/community/)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)