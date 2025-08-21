# Minimal Testing Guide: CloudFlare R2 Storage

Quick validation steps for the CloudFlare R2 integration.

## Essential Tests

### 1. Build Validation ⚡
```bash
cd examples/cloudflare-r2-storage
npm run build
```
**Expected**: No TypeScript errors, builds successfully.

### 2. Local Storage Fallback Test 🏠
```bash
# Start without R2 configuration
npm run dev:server
```
**Expected**: Server starts, uses local storage, admin accessible at `http://localhost:3000/admin`.

### 3. CloudFlare R2 Integration Test ☁️
```bash
# Configure R2 credentials in .env file
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=your-bucket-name

# Start server
npm run dev:server
```

**Test Asset Upload**:
1. Go to `http://localhost:3000/admin`
2. Login (superadmin/superadmin)
3. Navigate to **Catalog → Assets**
4. Upload a test image
5. Verify it appears in asset list

**Expected**: File uploads to CloudFlare R2, asset URL points to R2 bucket.

## Success Criteria ✅

- **Build completes** without TypeScript errors
- **Server starts** with local storage fallback
- **Asset upload works** via admin UI
- **Files stored in R2** when configured
- **Asset URLs accessible** from browser

## Quick Troubleshooting 🔧

**Build fails**: Run `npm install` to ensure dependencies are installed
**Server won't start**: Check for port conflicts (default: 3000)
**R2 upload fails**: Verify credentials and bucket name in .env file
**Assets not loading**: Check CloudFlare R2 bucket permissions

Total testing time: ~5 minutes