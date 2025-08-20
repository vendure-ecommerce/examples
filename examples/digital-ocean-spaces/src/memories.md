# Digital Ocean Spaces Integration for Vendure - Implementation Details

## Overview
This implementation provides a Digital Ocean Spaces storage strategy for Vendure's AssetServerPlugin, allowing assets to be stored in DigitalOcean Spaces object storage instead of the local file system.

## Key Implementation Details

### 1. S3 Compatibility
- DigitalOcean Spaces is S3-compatible, allowing us to use the AWS SDK v3 (`@aws-sdk/client-s3` and `@aws-sdk/lib-storage`)
- The implementation extends the existing S3AssetStorageStrategy pattern from Vendure

### 2. AWS SDK Configuration
- **Region**: Must be set to `'us-east-1'` for DigitalOcean Spaces compatibility (despite the actual region)
- **Endpoint**: Constructed as `https://${region}.digitaloceanspaces.com` (e.g., `https://nyc3.digitaloceanspaces.com`)
- **Force Path Style**: Set to `false` to use virtual-hosted style URLs (subdomain format)

### 3. Required Dependencies
```json
{
  "@aws-sdk/client-s3": "^3.0.0",
  "@aws-sdk/lib-storage": "^3.0.0"
}
```

### 4. Environment Variables
The implementation uses the following environment variables with fallbacks:
- `DO_SPACES_BUCKET`: The name of your DigitalOcean Space (defaults to "your-vendure-assets")
- `DO_SPACES_REGION`: The region where your Space is located (defaults to "nyc3")
- `DO_SPACES_ENDPOINT`: Optional custom endpoint URL (auto-constructed if not provided)
- `DO_SPACES_ACCESS_KEY`: Your DigitalOcean Spaces access key ID
- `DO_SPACES_SECRET_KEY`: Your DigitalOcean Spaces secret access key
- `ASSET_URL_PREFIX`: URL prefix for serving assets in production

### 5. Development vs Production Behavior
- **Development Mode**: Uses local file system storage (standard Vendure behavior)
- **Production Mode**: Switches to DigitalOcean Spaces storage automatically
- Mode detection: `process.env.APP_ENV === "dev"`

### 6. Asset URL Generation
- In development: Uses local server URLs
- In production: Uses configured `ASSET_URL_PREFIX` or falls back to default
- The `toAbsoluteUrl` function handles URL construction for serving assets

### 7. Bucket Management
- Automatically checks for bucket existence on initialization
- Attempts to create bucket if it doesn't exist (with private ACL)
- Provides detailed logging for bucket operations

### 8. File Operations Supported
- `writeFileFromBuffer`: Upload files from Buffer
- `writeFileFromStream`: Upload files from Stream
- `readFileToBuffer`: Download files as Buffer
- `readFileToStream`: Download files as Stream
- `deleteFile`: Delete files from storage
- `fileExists`: Check if file exists

### 9. Security Considerations
- All uploaded files default to private ACL
- Credentials are handled securely through environment variables
- No hardcoded secrets in the codebase

### 10. Error Handling
- Comprehensive error logging with context
- Graceful fallbacks for missing dependencies
- Detailed error messages for debugging

## Configuration Example

### Environment Variables (.env)
```env
# Development/Production toggle
APP_ENV=production

# DigitalOcean Spaces Configuration
DO_SPACES_BUCKET=my-vendure-store-assets
DO_SPACES_REGION=nyc3
DO_SPACES_ACCESS_KEY=your-access-key-id
DO_SPACES_SECRET_KEY=your-secret-access-key

# Optional: Custom endpoint (auto-generated if not provided)
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Asset serving URL prefix for production
ASSET_URL_PREFIX=https://my-vendure-store-assets.nyc3.cdn.digitaloceanspaces.com/
```

### Available DigitalOcean Spaces Regions
- `nyc3` - New York 3
- `ams3` - Amsterdam 3  
- `sgp1` - Singapore 1
- `sfo3` - San Francisco 3
- `fra1` - Frankfurt 1
- `tor1` - Toronto 1
- `blr1` - Bangalore 1
- `syd1` - Sydney 1

## CDN Integration
DigitalOcean Spaces comes with built-in CDN. To use it:
1. Enable CDN for your Space in the DigitalOcean control panel
2. Set `ASSET_URL_PREFIX` to your CDN endpoint (e.g., `https://your-space.nyc3.cdn.digitaloceanspaces.com/`)

## Troubleshooting

### Common Issues
1. **Missing AWS SDK packages**: Install `@aws-sdk/client-s3` and `@aws-sdk/lib-storage`
2. **Invalid credentials**: Verify access key and secret key are correct
3. **Bucket creation fails**: Check if bucket name is unique and region is supported
4. **CORS issues**: Configure CORS in DigitalOcean control panel for web asset serving

### Debug Logging
Enable Vendure's verbose logging to see detailed bucket and file operation logs:
```typescript
// In your vendure-config.ts
logger: new DefaultLogger({ level: LogLevel.Verbose })
```

## Performance Considerations
- Uses multipart uploads for large files via `@aws-sdk/lib-storage`
- Supports streaming for memory-efficient file handling
- Automatic bucket existence caching to reduce API calls

## Future Enhancements
- Support for custom CORS configuration
- Integration with DigitalOcean Spaces lifecycle policies
- Support for different storage classes
- Automatic CDN cache purging on asset updates