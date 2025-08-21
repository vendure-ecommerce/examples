# Minimal Testing Guide: S3-Compatible File Storage

Quick validation steps for the S3-compatible storage integration.

## Essential Tests

### 1. Build Validation ⚡
```bash
cd examples/s3-file-storage
npm run build
```
**Expected**: No TypeScript errors, builds successfully.

### 2. Local Storage Fallback Test 🏠
```bash
# Start without S3 configuration
npm run dev:server
```
**Expected**: Server starts, uses local storage fallback, admin accessible at `http://localhost:3000/admin`.

### 3. Core Functionality Test 🎯
```bash
# Configure S3-compatible service credentials in .env file
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=your-region
S3_ENDPOINT=your-endpoint-if-needed
S3_FORCE_PATH_STYLE=true-or-false

# Start server
npm run dev:server
```

**Storage Integration Core Test**:
1. Go to `http://localhost:3000/admin`
2. Login (admin/admin by default)
3. Navigate to **Catalog → Assets**
4. Upload a test image file
5. Verify file is stored in your S3-compatible service (check your storage provider's console/dashboard)
6. Verify the uploaded asset loads correctly in the admin UI

## Success Criteria ✅

- **Build completes** without TypeScript errors
- **Server starts** with local storage fallback when S3 not configured
- **File upload works** via admin UI to S3-compatible storage
- **Asset appears** in storage provider's console/dashboard
- **Asset URL accessible** and image displays correctly

## Quick Troubleshooting 🔧

**Build fails**: Run `npm install` to ensure dependencies are installed
**Server won't start**: Check for port conflicts (default: 3000)
**S3 upload fails**: Verify credentials and bucket configuration in .env file
**Assets not loading**: Check bucket permissions and CORS configuration

Total testing time: ~5 minutes