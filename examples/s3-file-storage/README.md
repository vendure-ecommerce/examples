# S3-Compatible File Storage for Vendure

A platform-agnostic Vendure example demonstrating S3-compatible object storage integration using Vendure's built-in `S3AssetStorageStrategy`. This implementation works seamlessly with multiple S3-compatible storage providers without requiring custom plugins.

## Overview

This example showcases how to configure Vendure to use S3-compatible object storage for digital assets using Vendure's native `configureS3AssetStorage` function. It supports multiple platforms with a single configuration approach:

- **AWS S3** - Amazon's native object storage service
- **Digital Ocean Spaces** - S3-compatible object storage with CDN
- **MinIO** - Self-hosted S3-compatible object storage
- **CloudFlare R2** - Zero-egress S3-compatible storage
- **Any S3-compatible service** - Compatible with S3 API standard

## Key Benefits

- ✅ **Platform-agnostic** - Single configuration works across multiple S3-compatible services
- ✅ **No custom plugins needed** - Uses Vendure's built-in S3 strategy
- ✅ **Local storage fallback** - Gracefully falls back to local storage when S3 isn't configured
- ✅ **Production-ready** - Battle-tested configuration patterns
- ✅ **Environment-based** - Easy switching between development and production storage

## Quick Start

```bash
# Clone and setup
cd examples/s3-file-storage
npm install

# Configure your storage provider (see Configuration section)
# Choose the appropriate .env.example file for your provider:
# cp .env.example.aws-s3 .env                    # For AWS S3
# cp .env.example.digital-ocean-spaces .env      # For Digital Ocean Spaces  
# cp .env.example.minio .env                     # For MinIO
# cp .env.example.cloudflare-r2 .env             # For CloudFlare R2
# cp .env.example .env                           # For general setup guide
# Edit .env with your storage provider credentials

# Build and run
npm run build
npm run dev:server
```

Visit:
- **Admin UI**: http://localhost:3000/admin
- **Shop API**: http://localhost:3000/shop-api
- **GraphQL Playground**: http://localhost:3000/graphiql

## Configuration

### Environment Variables

This example includes pre-configured `.env.example` files for each supported provider:

- **`.env.example`** - General template with all providers
- **`.env.example.aws-s3`** - AWS S3 specific configuration  
- **`.env.example.digital-ocean-spaces`** - Digital Ocean Spaces configuration
- **`.env.example.minio`** - MinIO self-hosted configuration
- **`.env.example.cloudflare-r2`** - CloudFlare R2 configuration

**Quick Setup:**
```bash
# Copy the appropriate template for your provider
cp .env.example.aws-s3 .env           # For AWS S3
# OR
cp .env.example.digital-ocean-spaces .env  # For Digital Ocean Spaces
# OR  
cp .env.example.minio .env            # For MinIO
# OR
cp .env.example.cloudflare-r2 .env    # For CloudFlare R2

# Then edit .env with your actual credentials
```

**General template structure:**

```bash
# Basic Vendure Configuration
APP_ENV=production
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD=your-secure-password
COOKIE_SECRET=your-cookie-secret-32-characters-min

# S3-Compatible Storage Configuration
# Leave empty to use local storage for development
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_REGION=us-east-1
S3_ENDPOINT=
S3_FORCE_PATH_STYLE=false
```

### Platform-Specific Configuration

#### AWS S3

```bash
# AWS S3 Configuration
S3_BUCKET=my-vendure-assets
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=wJalrXUtn...
S3_REGION=us-east-1
# S3_ENDPOINT= (leave empty for AWS S3)
# S3_FORCE_PATH_STYLE= (leave empty for AWS S3)
```

**Setup Steps:**
1. Create an S3 bucket in AWS Console
2. Create IAM user with S3 permissions
3. Generate access key and secret
4. Configure bucket policy for public read if needed

#### Digital Ocean Spaces

```bash
# Digital Ocean Spaces Configuration
S3_BUCKET=my-vendure-assets
S3_ACCESS_KEY_ID=DO00...
S3_SECRET_ACCESS_KEY=wJalrXUtn...
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_FORCE_PATH_STYLE=false
```

**Setup Steps:**
1. Create a Space in Digital Ocean Console
2. Generate Spaces access keys
3. Configure CDN endpoint if desired
4. Set appropriate CORS policy

**Important**: Use the regional endpoint (e.g., `https://fra1.digitaloceanspaces.com`) not the CDN endpoint. The AWS SDK constructs the full URL automatically.

#### MinIO (Self-Hosted)

```bash
# MinIO Configuration
S3_BUCKET=vendure-assets
S3_ACCESS_KEY_ID=minio-access-key
S3_SECRET_ACCESS_KEY=minio-secret-key
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
```

**Setup Steps:**
1. Install and run MinIO server
2. Create bucket via MinIO Console
3. Generate access keys
4. Configure bucket policy for public access

**Quick Start with Docker Compose:**
```bash
# Start MinIO using the included docker-compose.yml
docker compose up -d minio

# Access MinIO Console at http://localhost:9090
# Login: minioadmin / minioadmin
# Create bucket: vendure-assets

# Use the .env.example.minio configuration
cp .env.example.minio .env
# No credential changes needed - defaults work with Docker setup
```

The included `docker-compose.yml` provides a ready-to-use MinIO setup with default credentials (`minioadmin`/`minioadmin`) and proper health checks.

#### CloudFlare R2

```bash
# CloudFlare R2 Configuration
S3_BUCKET=vendure-assets
S3_ACCESS_KEY_ID=your-r2-access-key
S3_SECRET_ACCESS_KEY=your-r2-secret-key
S3_REGION=auto
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true
```

**Setup Steps:**
1. Enable R2 in CloudFlare Dashboard
2. Create R2 bucket
3. Generate R2 API tokens
4. Configure custom domain if needed

## Architecture

### Configuration Pattern

The example uses Vendure's built-in `configureS3AssetStorage` function instead of creating a custom plugin. This approach:

```typescript
// src/vendure-config.ts
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';

AssetServerPlugin.init({
  // ... other options
  storageStrategyFactory: process.env.S3_BUCKET 
    ? configureS3AssetStorage({
        bucket: process.env.S3_BUCKET,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        nativeS3Configuration: {
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          signatureVersion: 'v4',
        },
      })
    : undefined, // Use local storage when S3 not configured
});
```

### Platform Detection

The configuration automatically adapts to different platforms based on environment variables:

- **AWS S3**: Default configuration (no endpoint, no forcePathStyle)
- **Digital Ocean Spaces**: Custom endpoint, virtual-hosted style
- **MinIO**: Custom endpoint with path-style requests
- **CloudFlare R2**: Custom endpoint with path-style requests
- **Local Storage**: Fallback when `S3_BUCKET` is not set

## Usage Examples

### Basic Asset Upload

Once configured, asset uploads work automatically through the Vendure Admin UI:

1. Go to `http://localhost:3000/admin`
2. Navigate to **Catalog → Assets**
3. Upload images - they'll be stored in your configured S3-compatible storage
4. Assets are automatically served with proper URLs

### Programmatic Asset Management

```typescript
import { AssetService } from '@vendure/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyAssetService {
  constructor(private assetService: AssetService) {}

  async uploadProductImage(fileBuffer: Buffer, filename: string) {
    // This will automatically use your configured S3-compatible storage
    const asset = await this.assetService.createFromFileStream(
      Readable.from(fileBuffer),
      filename
    );
    return asset;
  }
}
```

## Migration Between Platforms

### From Local Storage

1. **Backup existing assets**: Copy files from local storage directory
2. **Configure S3 service**: Set up your chosen S3-compatible provider
3. **Update environment variables**: Configure S3 credentials
4. **Re-upload assets**: Upload assets through admin UI or migration script

### Between S3-Compatible Services

The configuration can be easily switched between providers by updating environment variables:

```bash
# Switch from AWS S3 to Digital Ocean Spaces
# Old (AWS S3):
S3_REGION=us-east-1
# S3_ENDPOINT= (empty)
# S3_FORCE_PATH_STYLE= (empty)

# New (Digital Ocean Spaces):
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_FORCE_PATH_STYLE=false
```

## Platform Comparison

| Feature | AWS S3 | Digital Ocean Spaces | MinIO | CloudFlare R2 |
|---------|--------|---------------------|-------|---------------|
| **Endpoint** | Default | Regional endpoint | Custom server | Account endpoint |
| **Path Style** | Virtual-hosted | Virtual-hosted | Path-style | Path-style |
| **Region** | Required | Required | Dummy value | 'auto' |
| **CDN** | CloudFront | Built-in | Manual setup | Built-in |
| **Egress Fees** | Yes | Yes | None | None |
| **Global Availability** | Yes | Limited regions | Self-hosted | Yes |

## Troubleshooting

### Common Issues

1. **Assets not uploading**:
   ```
   Error: Access denied
   ```
   - Check access key permissions
   - Verify bucket policy allows uploads
   - Ensure credentials are correctly configured

2. **Assets not serving**:
   ```
   404 Not Found
   ```
   - Verify bucket exists and is accessible
   - Check bucket CORS configuration
   - Ensure `S3_ENDPOINT` is correct

3. **Path-style vs virtual-hosted**:
   ```
   Error: The specified bucket does not exist
   ```
   - Try toggling `S3_FORCE_PATH_STYLE` setting
   - MinIO requires `S3_FORCE_PATH_STYLE=true`
   - AWS S3 works with both styles

### Debug Mode

Enable debug logging to troubleshoot S3 operations:

```bash
DEBUG=Vendure* npm run dev:server
```

### Testing Configuration

Test your S3 configuration with a simple upload via admin UI:

1. Start server with S3 configuration
2. Upload a small test image
3. Verify image appears in your S3 bucket
4. Check that image URL is accessible

## Performance Considerations

### CDN Integration

Most S3-compatible services offer CDN integration:

- **AWS S3**: Use CloudFront for global distribution
- **Digital Ocean Spaces**: Built-in CDN with custom domains
- **CloudFlare R2**: Automatic edge caching via CloudFlare network
- **MinIO**: Configure reverse proxy with caching

### Cost Optimization

Consider storage and transfer costs:

- **CloudFlare R2**: Zero egress fees
- **AWS S3**: Pay for storage and data transfer
- **Digital Ocean Spaces**: Fixed pricing with generous transfer allowances
- **MinIO**: Only infrastructure costs

### Security Best Practices

1. **Use IAM roles** instead of access keys when possible
2. **Restrict bucket permissions** to minimum required access
3. **Enable bucket versioning** for asset backup and recovery
4. **Configure proper CORS** policies for web access
5. **Use HTTPS endpoints** for secure asset delivery

## Production Deployment

### Environment-Specific Configuration

Use different storage configurations for different environments:

```bash
# Development
S3_BUCKET=vendure-dev-assets

# Staging
S3_BUCKET=vendure-staging-assets

# Production
S3_BUCKET=vendure-prod-assets
```

### Monitoring and Alerts

Set up monitoring for:
- Storage usage and costs
- Upload/download success rates
- Asset serving performance
- Security access patterns

This example provides a robust, platform-agnostic foundation for S3-compatible asset storage in Vendure applications, eliminating the need for custom storage plugins while maintaining flexibility across different storage providers.