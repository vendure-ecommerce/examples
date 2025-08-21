# CloudFlare R2 Digital Storage for Vendure

A complete, production-ready Vendure example demonstrating CloudFlare R2 object storage integration for digital asset management. This implementation leverages CloudFlare R2's S3-compatible API to provide cost-effective, globally distributed asset storage with zero egress fees.

## Overview

CloudFlare R2 is a modern object storage service that provides S3-compatible APIs with several advantages:
- **Zero egress fees** - No charges for data transfer out
- **Global edge network** - Assets served from CloudFlare's worldwide CDN
- **S3 compatibility** - Works with existing AWS SDK tooling
- **Cost-effective** - Competitive pricing with predictable costs
- **High performance** - Built on CloudFlare's global network

This example integrates R2 with Vendure's AssetServerPlugin, allowing you to store and serve all your product images, documents, and other digital assets through CloudFlare's infrastructure.

## Quick Start

```bash
# Clone and setup
cd examples/cloudflare-r2-storage
npm install

# Configure CloudFlare R2 (see Configuration section)
cp .env.example .env
# Edit .env with your CloudFlare R2 credentials

# Build and run
npm run build
npm run dev:server
```

Visit:
- **Admin UI**: http://localhost:3000/admin
- **Shop API**: http://localhost:3000/shop-api
- **GraphQL Playground**: http://localhost:3000/graphiql

## Features

- ✅ **Complete CloudFlare R2 integration** - Full S3-compatible asset storage
- ✅ **TypeScript best practices** - No `any` types, comprehensive type safety
- ✅ **Environment-based configuration** - Easy deployment across environments
- ✅ **Fallback to local storage** - Works without R2 configuration for development
- ✅ **Comprehensive error handling** - Robust error management and logging
- ✅ **Production-ready architecture** - Follows Vendure and CloudFlare best practices
- ✅ **Custom domain support** - Serve assets from your own domain
- ✅ **Development-friendly** - Clear error messages and configuration validation

## Configuration

### CloudFlare R2 Setup

1. **Create CloudFlare Account**: Sign up at [cloudflare.com](https://cloudflare.com)

2. **Enable R2**: Go to R2 Object Storage in your CloudFlare dashboard

3. **Create a Bucket**:
   ```bash
   # Via CloudFlare dashboard or CLI
   wrangler r2 bucket create vendure-assets
   ```

4. **Generate API Tokens**:
   - Go to **R2** → **Manage R2 API tokens**
   - Click **Create API token**
   - Select **Custom token**
   - Permissions: **Object Read & Write**
   - Account Resources: **Include - All accounts**
   - Zone Resources: **Include - All zones**

5. **Note your Account ID**: Found in the right sidebar of CloudFlare dashboard

### Environment Variables

Create a `.env` file in the project root:

```bash
# CloudFlare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET=vendure-assets

# Optional: Custom domain for assets (requires CloudFlare configuration)
CLOUDFLARE_R2_CUSTOM_DOMAIN=assets.yourstore.com

# Optional: Region (defaults to 'auto')
CLOUDFLARE_R2_REGION=auto

# Optional: Force HTTPS (defaults to true)
CLOUDFLARE_R2_USE_HTTPS=true

# Vendure Configuration
APP_ENV=production
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD=your-secure-password
COOKIE_SECRET=your-cookie-secret-32-characters-min
```

### Custom Domain Setup (Optional)

To serve assets from your own domain:

1. **Add a Custom Domain in CloudFlare R2**:
   - Go to your R2 bucket settings
   - Add a custom domain (e.g., `assets.yourstore.com`)
   - CloudFlare will provide DNS instructions

2. **Update DNS**:
   - Add a CNAME record pointing to your R2 bucket
   - Enable CloudFlare proxy (orange cloud)

3. **Configure Environment**:
   ```bash
   CLOUDFLARE_R2_CUSTOM_DOMAIN=assets.yourstore.com
   ```

## Integration with CloudFlare R2

### Account Setup

1. **CloudFlare Dashboard**:
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Navigate to **R2 Object Storage**
   - Note your **Account ID** (visible in dashboard sidebar)

2. **Bucket Creation**:
   ```bash
   # Using CloudFlare CLI (wrangler)
   npm install -g wrangler
   wrangler login
   wrangler r2 bucket create vendure-assets
   
   # Or use the CloudFlare dashboard
   ```

3. **API Token Generation**:
   - Go to **R2** → **Manage R2 API tokens**
   - Create a custom token with **Object Read & Write** permissions
   - Copy the **Access Key ID** and **Secret Access Key**

4. **Permissions Configuration**:
   - Ensure the token has access to your specific bucket
   - Set appropriate read/write permissions
   - Consider IP restrictions for production security

### Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Token Permissions**: Use least-privilege access (bucket-specific tokens)
3. **Custom Domains**: Use HTTPS with proper SSL/TLS configuration
4. **Access Control**: Implement proper CloudFlare security rules
5. **Monitoring**: Enable CloudFlare analytics and alerts

## Usage Examples

### Basic Asset Upload

```typescript
// The AssetServerPlugin automatically handles uploads to R2
// when configured. No code changes needed in your application.

// Example: Upload via Admin UI
// 1. Go to http://localhost:3000/admin
// 2. Navigate to Catalog → Assets
// 3. Upload images - they'll be stored in CloudFlare R2
// 4. Assets are automatically served via R2's global CDN
```

### Programmatic Asset Management

```typescript
import { AssetService } from '@vendure/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyAssetService {
  constructor(private assetService: AssetService) {}

  async uploadProductImage(fileBuffer: Buffer, filename: string) {
    // This will automatically use CloudFlare R2 when configured
    const asset = await this.assetService.createFromFileStream(
      Readable.from(fileBuffer),
      filename
    );
    return asset;
  }
}
```

### Custom Asset URLs

```typescript
// When using custom domains, assets are served from your domain
// Example URL: https://assets.yourstore.com/product-image.jpg

// The plugin automatically handles URL generation
const assetUrl = asset.source; // Points to your R2 bucket or custom domain
```

## Customization

### Extending the Storage Strategy

```typescript
// src/plugins/custom-r2-storage/custom-r2-strategy.ts
import { CloudFlareR2AssetStorageStrategy } from './cloudflare-r2-storage';

export class CustomR2StorageStrategy extends CloudFlareR2AssetStorageStrategy {
  async writeFileFromBuffer(fileName: string, data: Buffer): Promise<string> {
    // Add custom logic (e.g., image optimization, virus scanning)
    const optimizedData = await this.optimizeImage(data);
    return super.writeFileFromBuffer(fileName, optimizedData);
  }

  private async optimizeImage(data: Buffer): Promise<Buffer> {
    // Custom image optimization logic
    return data;
  }
}
```

### Environment-Specific Configuration

```typescript
// src/config/storage-config.ts
import { configureCloudFlareR2Storage } from './plugins/cloudflare-r2-storage';

export function createStorageStrategy() {
  const env = process.env.NODE_ENV;
  
  if (env === 'production') {
    return configureCloudFlareR2Storage({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      customDomain: process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN,
    });
  }
  
  // Use local storage for development
  return undefined;
}
```

### Asset Processing Pipeline

```typescript
// Example: Add image processing before upload
import sharp from 'sharp';

export class ProcessingR2Strategy extends CloudFlareR2AssetStorageStrategy {
  async writeFileFromBuffer(fileName: string, data: Buffer): Promise<string> {
    if (this.isImage(fileName)) {
      const processed = await sharp(data)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      return super.writeFileFromBuffer(fileName, processed);
    }
    return super.writeFileFromBuffer(fileName, data);
  }
}
```

## Architecture

### Plugin Structure

```
src/plugins/cloudflare-r2-storage/
├── types.ts                              # TypeScript interfaces
├── constants.ts                          # Plugin constants and config
├── cloudflare-r2-asset-storage-strategy.ts # Core storage implementation
├── configure-cloudflare-r2-storage.ts   # Configuration helpers
└── index.ts                              # Public API exports
```

### Integration Points

1. **AssetServerPlugin**: Uses the `storageStrategyFactory` option
2. **S3 Compatibility**: Leverages AWS SDK v3 for CloudFlare R2
3. **Environment Config**: Reads from environment variables with fallbacks
4. **Error Handling**: Comprehensive logging and error management
5. **URL Generation**: Supports custom domains and HTTPS

### Key Components

- **CloudFlareR2AssetStorageStrategy**: Core implementation of `AssetStorageStrategy`
- **Configuration Helpers**: Functions for easy setup and environment management
- **Type Definitions**: Complete TypeScript interfaces for configuration
- **Error Management**: Structured error handling with meaningful messages

## Performance Considerations

### CloudFlare R2 Benefits

1. **Global CDN**: Assets served from edge locations worldwide
2. **Zero Egress Fees**: No charges for data transfer out
3. **High Availability**: Built on CloudFlare's resilient infrastructure
4. **Caching**: Automatic edge caching for faster asset delivery

### Optimization Tips

1. **Image Formats**: Use modern formats (WebP, AVIF) when possible
2. **Compression**: Implement image optimization in your storage strategy
3. **Custom Domains**: Use CloudFlare's CDN features for maximum performance
4. **Caching Headers**: Configure appropriate cache-control headers

### Monitoring and Analytics

1. **CloudFlare Analytics**: Monitor bandwidth, requests, and performance
2. **R2 Usage Metrics**: Track storage usage and costs
3. **Error Monitoring**: Implement logging for storage operations
4. **Performance Metrics**: Monitor upload/download speeds

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   ```
   Error: CloudFlare R2 access credentials are required
   ```
   - Verify `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - Check that the API token has proper permissions

2. **Bucket Access Errors**:
   ```
   Error: Failed to upload file to CloudFlare R2
   ```
   - Verify bucket name in `CLOUDFLARE_R2_BUCKET`
   - Ensure bucket exists and is accessible

3. **Custom Domain Issues**:
   ```
   Assets not loading from custom domain
   ```
   - Verify DNS configuration
   - Check CloudFlare proxy settings
   - Ensure SSL certificates are valid

### Debug Mode

Enable debug logging:

```bash
# Set log level for detailed R2 operations
DEBUG=CloudFlareR2AssetStorageStrategy npm run dev:server
```

### Configuration Validation

The plugin validates configuration on startup:

```typescript
// Example validation error
Error: CloudFlare Account ID is required
  at CloudFlareR2AssetStorageStrategy.validateConfig
```

## Migration from Other Storage

### From Local Storage

1. **Backup existing assets**: Copy files from local storage
2. **Configure R2**: Set up CloudFlare R2 credentials
3. **Update configuration**: Enable R2 storage strategy
4. **Upload assets**: Re-upload or migrate existing assets

### From AWS S3

The configuration is similar to S3, but with CloudFlare-specific endpoints:

```typescript
// AWS S3 (old)
const s3Config = {
  region: 'us-east-1',
  bucket: 'my-bucket',
  // ... S3-specific config
};

// CloudFlare R2 (new)
const r2Config = {
  accountId: 'your-account-id',
  region: 'auto', // R2 uses 'auto'
  bucket: 'my-bucket',
  // ... R2-specific config
};
```

## Cost Analysis

### CloudFlare R2 Pricing (as of 2024)

- **Storage**: $0.015 per GB/month
- **Class A Operations** (writes): $4.50 per million
- **Class B Operations** (reads): $0.36 per million
- **Egress**: **$0** (Free!)

### Comparison with Alternatives

| Service | Storage (GB/month) | Egress (GB) | Total (100GB storage, 1TB egress) |
|---------|-------------------|-------------|-----------------------------------|
| CloudFlare R2 | $1.50 | $0 | **$1.50** |
| AWS S3 | $2.30 | $90+ | **$92.30+** |
| Google Cloud | $2.00 | $120+ | **$122.00+** |

*CloudFlare R2 provides significant cost savings, especially for high-traffic sites.*

## Production Deployment

### Environment Setup

1. **CloudFlare Configuration**:
   ```bash
   # Production environment variables
   CLOUDFLARE_ACCOUNT_ID=prod-account-id
   CLOUDFLARE_R2_BUCKET=prod-vendure-assets
   CLOUDFLARE_R2_CUSTOM_DOMAIN=assets.yourstore.com
   ```

2. **Security Configuration**:
   - Use restricted API tokens
   - Enable CloudFlare security features
   - Configure proper CORS policies

3. **Performance Optimization**:
   - Enable CloudFlare caching
   - Configure appropriate cache headers
   - Use CloudFlare Image Optimization (if available)

### Deployment Checklist

- [ ] CloudFlare R2 bucket created
- [ ] API tokens generated with minimal permissions
- [ ] Environment variables configured
- [ ] Custom domain setup (if using)
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and alerts enabled
- [ ] Backup strategy implemented

### Monitoring

1. **CloudFlare Analytics**: Monitor bandwidth and request patterns
2. **Application Logs**: Track upload/download operations
3. **Error Tracking**: Monitor storage operation failures
4. **Cost Monitoring**: Track R2 usage and costs

This example provides a complete, production-ready integration between Vendure and CloudFlare R2, offering significant cost savings and performance benefits for e-commerce applications with substantial digital asset requirements.