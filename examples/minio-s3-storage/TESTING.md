# MinIO S3 Storage Integration - Testing Guide

Simple testing guide for the MinIO S3 storage integration example.

## Essential Tests

### 1. 🏗️ Build Test
```bash
npm run build
```
**Expected**: TypeScript compiles without errors.

### 2. 🔧 Vendure Migration Test
```bash
# Test with local storage (default when no .env)
npm run dev:server

# Test with MinIO enabled
echo "MINIO_ENABLED=true" > .env
npm run dev:server
```
**Expected**: Server starts and logs show database migrations running successfully.

### 3. 🐳 MinIO Server Test
```bash
# Use the included Docker Compose configuration
docker compose up -d minio
./setup-minio.sh
```
**Expected**: MinIO starts using the pre-configured docker-compose.yml and bucket is configured with public access.

### 4. 📤 File Upload Test
1. Navigate to http://localhost:3000/admin
2. Login (superadmin/superadmin)
3. Go to Catalog → Products → Create Product
4. Upload an image asset
5. Verify the image displays correctly

**Expected**: Asset uploads to MinIO and is accessible via browser.