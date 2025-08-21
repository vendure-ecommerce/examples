# Digital Ocean Spaces Example Store

This example demonstrates how to integrate DigitalOcean Spaces object storage with Vendure's AssetServerPlugin for storing and serving product images and other assets.

## Features

- **Cloud Asset Storage**: Store all Vendure assets in DigitalOcean Spaces instead of local file system
- **S3 Compatibility**: Uses AWS SDK v3 for seamless integration with DigitalOcean's S3-compatible API
- **Development/Production Toggle**: Automatically switches between local storage (dev) and Spaces (production)
- **CDN Ready**: Configured to work with DigitalOcean's built-in CDN for fast global asset delivery
- **Automatic Bucket Management**: Creates and manages Spaces bucket automatically

## Prerequisites

1. **DigitalOcean Account**: Sign up at [DigitalOcean](https://digitalocean.com)
2. **DigitalOcean Space**: Create a Space in your preferred region
3. **API Keys**: Generate Spaces access keys in the DigitalOcean control panel

## Setup

### 1. Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in this directory:

```env
# Development/Production toggle
APP_ENV=production

# DigitalOcean Spaces Configuration
DO_SPACES_BUCKET=your-space-name
DO_SPACES_REGION=nyc3
DO_SPACES_ACCESS_KEY=your-access-key-id
DO_SPACES_SECRET_KEY=your-secret-access-key

# Optional: Asset serving URL prefix for production
ASSET_URL_PREFIX=https://your-space-name.nyc3.cdn.digitaloceanspaces.com/

# Standard Vendure configuration
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
COOKIE_SECRET=your-cookie-secret
```

### 3. Available Regions

Choose from these DigitalOcean Spaces regions:
- `nyc3` - New York 3
- `ams3` - Amsterdam 3  
- `sgp1` - Singapore 1
- `sfo3` - San Francisco 3
- `fra1` - Frankfurt 1
- `tor1` - Toronto 1
- `blr1` - Bangalore 1
- `syd1` - Sydney 1

## Running the Example

```bash
# Development mode (uses local file storage)
APP_ENV=dev npm run dev --workspace=digital-ocean-spaces

# Production mode (uses DigitalOcean Spaces)
APP_ENV=production npm run dev --workspace=digital-ocean-spaces

# Build the example
npm run build --workspace=digital-ocean-spaces

# Run built version
npm run start --workspace=digital-ocean-spaces
```

## How It Works

### Development Mode
- Assets stored locally in `static/assets/`
- Standard Vendure file system behavior
- No Spaces integration required

### Production Mode
- Assets automatically uploaded to DigitalOcean Spaces
- Uses S3-compatible API via AWS SDK v3
- Bucket created automatically if it doesn't exist
- All files stored with private ACL by default

### Key Implementation

The example includes a custom `DigitalOceanSpacesAssetStorageStrategy` that:

1. **Extends Vendure's AssetStorageStrategy interface**
2. **Uses AWS SDK v3 for S3-compatible operations**
3. **Handles bucket creation and management**
4. **Provides streaming and buffer-based file operations**
5. **Generates proper URLs for asset serving**

## CDN Configuration

To use DigitalOcean's built-in CDN:

1. Enable CDN for your Space in the DigitalOcean control panel
2. Set `ASSET_URL_PREFIX` to your CDN endpoint:
   ```env
   ASSET_URL_PREFIX=https://your-space-name.nyc3.cdn.digitaloceanspaces.com/
   ```

## CORS Configuration

For web access to assets, configure CORS in your DigitalOcean Space:

1. Go to your Space in the DigitalOcean control panel
2. Navigate to Settings → CORS Configurations
3. Add rules for your domains

## Troubleshooting

### Common Issues

1. **Missing AWS SDK packages**: 
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
   ```

2. **Invalid credentials**: Verify your access key and secret in the DigitalOcean control panel

3. **Bucket creation fails**: Ensure bucket name is unique and region is supported

4. **Assets not loading**: Check CORS configuration and `ASSET_URL_PREFIX` setting

### Debug Logging

Enable verbose logging in `vendure-config.ts`:
```typescript
import { DefaultLogger, LogLevel } from '@vendure/core';

// Add to your config
logger: new DefaultLogger({ level: LogLevel.Verbose })
```

## File Structure

```
src/
├── digital-ocean-spaces-asset-storage-strategy.ts  # Custom storage strategy
├── vendure-config.ts                               # Main Vendure configuration
├── memories.md                                     # Implementation details
├── index.ts                                        # Server entry point
└── index-worker.ts                                 # Worker entry point
```

## Cost Considerations

- **Storage**: DigitalOcean Spaces charges for storage and data transfer
- **CDN**: Built-in CDN is included at no extra cost
- **API Requests**: Charged per request (GET, PUT, DELETE operations)

For current pricing, visit [DigitalOcean Spaces Pricing](https://www.digitalocean.com/pricing/spaces)

## Next Steps

1. **Enable CDN**: Set up CDN for faster global asset delivery
2. **Configure CORS**: Set up CORS rules for your storefront domains
3. **Set up Lifecycle Policies**: Configure automatic deletion of old assets if needed
4. **Monitor Usage**: Track storage and bandwidth usage in DigitalOcean dashboard
