# MinIO S3 Storage Integration for Vendure

A complete, production-ready Vendure example demonstrating how to integrate MinIO (self-hosted S3-compatible object storage) for asset management. This example shows how to configure Vendure's AssetServerPlugin to use MinIO instead of local file storage, providing scalable and distributed asset storage capabilities.

## Overview

MinIO is a high-performance, S3-compatible object storage solution perfect for storing Vendure assets like product images, documents, and media files. This example demonstrates:

- **Complete MinIO integration** using Vendure's built-in S3AssetStorageStrategy
- **Flexible configuration** supporting both development and production environments
- **Automatic fallback** to local storage when MinIO is not configured
- **Environment-based setup** with sensible defaults for quick development
- **Production-ready architecture** with proper error handling and security considerations

## Quick Start

```bash
# 1. Install dependencies (already done during example creation)
npm install

# 2. Start MinIO server (using Docker)
docker run -p 9000:9000 -p 9090:9090 --name minio \
  -e "MINIO_ACCESS_KEY=minioadmin" \
  -e "MINIO_SECRET_KEY=minioadmin" \
  -v /tmp/data:/data \
  -v /tmp/config:/root/.minio \
  minio/minio server /data --console-address ":9090"

# 3. Create .env file (optional - uses defaults if not provided)
cp .env.example .env

# 4. Set up MinIO bucket with public access (REQUIRED)
# This script creates the bucket and enables public read access
# Without this step, asset images will return 403 Forbidden errors
./setup-minio.sh

# 5. Build and run Vendure
npm run build
npm run dev:server
```

Access points:
- **Vendure Admin UI**: http://localhost:3000/admin
- **MinIO Console**: http://localhost:9090 (admin: minioadmin/minioadmin)
- **GraphiQL**: http://localhost:3000/graphiql

## Features

- ✅ **Complete S3-compatible storage** using AWS SDK v3
- ✅ **MinIO integration** with proper endpoint and path-style configuration
- ✅ **Development-friendly** with Docker-based MinIO setup
- ✅ **Production-ready** with environment-based configuration
- ✅ **Automatic fallback** to local storage when MinIO is unavailable
- ✅ **TypeScript best practices** with proper type safety
- ✅ **Zero-configuration startup** with sensible defaults
- ✅ **Asset URL generation** for direct MinIO access
- ✅ **Bucket management** with configurable bucket names

## MinIO Setup

### Option 1: Docker (Recommended for Development)

```bash
# Start MinIO with default credentials
docker run -p 9000:9000 -p 9090:9090 --name minio \
  -e "MINIO_ACCESS_KEY=minioadmin" \
  -e "MINIO_SECRET_KEY=minioadmin" \
  -v /tmp/data:/data \
  -v /tmp/config:/root/.minio \
  minio/minio server /data --console-address ":9090"

# Or using Docker Compose (create docker-compose.yml)
version: '3.8'
services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9090:9090"
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - ./minio-data:/data
      - ./minio-config:/root/.minio
    command: server /data --console-address ":9090"
```

### Option 2: Production Deployment

For production, install MinIO on your servers or use cloud-hosted MinIO services:

```bash
# Download MinIO binary (Linux)
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Start MinIO server
export MINIO_ACCESS_KEY=your-access-key
export MINIO_SECRET_KEY=your-secret-key
minio server /data --console-address ":9090"
```

### Creating Buckets and Setting Permissions ⚠️ **CRITICAL STEP**

**Automatic Setup (Recommended)**:
```bash
./setup-minio.sh
```

**Why this is required**: MinIO defaults to private buckets. Without public read permissions, assets will return 403 Forbidden errors.

**Note**: Only required when using MinIO storage (default). Set `ENABLE_LOCAL_FALLBACK=true` to skip bucket setup and use local storage instead.

**Manual Setup**:
1. Access MinIO Console at http://localhost:9090
2. Login with credentials (default: minioadmin/minioadmin)
3. Create bucket named `vendure-assets` (or your configured bucket name)
4. **CRITICAL**: Set bucket policy to allow public read access for assets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "*"},
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vendure-assets/*"
    }
  ]
}
```

## Configuration

### MinIO Bucket Setup

MinIO requires the bucket to have public read permissions for Vendure assets to work properly. Without this, assets will return 403 Forbidden errors.

**Quick setup**: Run the provided script `./setup-minio.sh` to automatically create the bucket and configure permissions.

**Manual setup**: Access MinIO Console at http://localhost:9090 and set the `vendure-assets` bucket to allow anonymous read access.

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# MinIO Configuration (Primary Storage)
MINIO_ENDPOINT=http://localhost:9000        # MinIO server endpoint
MINIO_ACCESS_KEY=minioadmin                 # Access key ID
MINIO_SECRET_KEY=minioadmin                 # Secret access key
MINIO_BUCKET=vendure-assets                 # Bucket name for assets
MINIO_REGION=us-east-1                      # AWS region (required by SDK)

# Development/Testing Options
ENABLE_LOCAL_FALLBACK=false                 # Set to true to use local storage instead

# Vendure Configuration
APP_ENV=dev                                 # Environment mode
PORT=3000                                   # Server port
SUPERADMIN_USERNAME=superadmin              # Admin username
SUPERADMIN_PASSWORD=superadmin              # Admin password
COOKIE_SECRET=cookie-secret-minio-s3-storage # Cookie encryption secret
```

### Storage Strategy

This example uses **MinIO as the primary storage strategy**:

1. **Default**: Uses MinIO S3-compatible storage for all assets
2. **Development Fallback**: Set `ENABLE_LOCAL_FALLBACK=true` to use local file storage for testing
3. **Production Ready**: MinIO configuration with proper defaults
4. **Clear Purpose**: Demonstrates real S3-compatible object storage integration

## Usage Examples

### Uploading Assets via Admin UI

1. Navigate to http://localhost:3000/admin
2. Login with superadmin credentials
3. Go to Catalog → Products
4. Create or edit a product
5. Upload images using the asset picker
6. Images will be stored in MinIO and served directly from MinIO URLs

### Programmatic Asset Upload

```typescript
import { AssetService, RequestContext } from '@vendure/core';

// In your custom service or resolver
async uploadToMinIO(ctx: RequestContext, file: Buffer, filename: string) {
  const assetService = this.injector.get(AssetService);
  
  const asset = await assetService.createFromBuffer(ctx, {
    buffer: file,
    filename: filename,
    mimetype: 'image/jpeg',
  });
  
  // Asset is now stored in MinIO and URL points to MinIO endpoint
  console.log('Asset URL:', asset.source); // e.g., http://localhost:9000/vendure-assets/asset-123.jpg
  
  return asset;
}
```

## Troubleshooting

### Common Issues

**Issue: 403 Forbidden when accessing asset URLs** ⚠️ **MOST COMMON**
```
Error: GET http://localhost:9000/vendure-assets/preview/xyz.png - 403 Forbidden
```

**Root Cause**: MinIO bucket doesn't have public read permissions configured.

**Solutions**:
1. **Automatic setup**: Run `./setup-minio.sh` (recommended)
2. **Manual setup via Console**:
   - Go to http://localhost:9090 → Buckets → `vendure-assets` → Access Rules
   - Add policy allowing public read access
3. **MinIO CLI**: `mc anonymous set public myminio/vendure-assets`

**Issue: "Connection refused to MinIO"**
```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs minio

# Verify port accessibility
telnet localhost 9000
```

**Issue: "Bucket not found"**
```bash
# Create bucket via MinIO console or CLI
mc mb myminio/vendure-assets
```

**Issue: "Access denied"**
```bash
# Verify credentials and bucket policies
# Check MinIO console → Buckets → Policy
```

**Issue: "Asset URLs not working"**
- Verify `MINIO_ENDPOINT` is accessible from client browsers
- Check bucket policy allows public read access
- Ensure `forcePathStyle: true` for MinIO compatibility

## Architecture

### Storage Strategy Decision Flow

```
Request to upload asset
↓
Check MINIO_ENDPOINT env variable
↓
┌─ Set? → Use MinIO S3AssetStorageStrategy
│         ↓
│         Connect to MinIO server
│         ↓
│         Store file in configured bucket
│         ↓
│         Return MinIO URL
│
└─ Not Set? → Use LocalAssetStorageStrategy
              ↓
              Store file in local filesystem
              ↓
              Return local file path
```

## Related Documentation

- [MinIO Documentation](https://docs.min.io/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)
- [Vendure AssetServerPlugin](https://docs.vendure.io/reference/core-plugins/asset-server-plugin/)
- [Vendure S3AssetStorageStrategy](https://docs.vendure.io/reference/core-plugins/asset-server-plugin/s3asset-storage-strategy/)

---

This example provides a complete, production-ready MinIO integration for Vendure that can be easily customized and deployed in various environments.
