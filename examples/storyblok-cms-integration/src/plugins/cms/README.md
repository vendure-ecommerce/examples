---
title: "CMS Integration Plugin"
---

# CMS Integration Plugin

A complete, production-ready Vendure plugin for seamless e-commerce data synchronization with headless Content Management Systems. Keep your product catalog, variants, and collections in sync across your e-commerce and content platforms.

## Overview

The CMS Integration Plugin automatically synchronizes your Vendure product data with external CMS platforms, enabling unified content management across your e-commerce ecosystem. It provides real-time event-driven synchronization, job queue processing for reliability, and extensible architecture for multiple CMS providers.

## Quick Start

```bash
npm install
npm run build
npm run dev:server
```

## Features

- Real-time product, variant, and collection synchronization
- Event-driven architecture with job queue processing
- Environment-based configuration
- Comprehensive error handling and retry mechanisms
- Rate limiting
- Extensible for multiple CMS platforms
- Admin API for manual sync operations
- Scheduled sync tasks for data consistency

## Prerequisites

- Node.js 20+ with npm package manager
- An existing Vendure project created with the [Vendure create command](https://docs.vendure.io/guides/getting-started/installation/)
- An account with a supported CMS platform (currently Storyblok, with more platforms coming)

## CMS Platform Setup

Configure your chosen CMS platform by following the setup instructions below:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="storyblok" label="Storyblok">

### Setting up Storyblok

1. **Create a Storyblok Account**
   - Sign up at [Storyblok](https://www.storyblok.com/)
   - Create a new space or use an existing one
   - Navigate to your space dashboard

2. **Generate Management API Token**
   - Go to "Settings" → "Access Tokens"
   - Click "Create Token"
   - Select "Management API" token type
   - Choose appropriate permissions for content management
   - Copy the generated token (keep this secure)

3. **Configure Content Types**
   - Define content types for your e-commerce entities:
     - Product content type with fields for name, description, price, etc.
     - Collection content type for product groupings
     - ProductVariant content type for variant-specific data
   - Configure field mappings to match your Vendure schema

4. **Environment Variables**

   ```bash
   # Storyblok Configuration
   CMS_API_URL=https://mapi.storyblok.com/v1/spaces/{SPACE_ID}
   CMS_API_KEY=your-management-api-token
   STORYBLOK_SPACE_ID=your-space-id
   RETRY_ATTEMPTS=3
   RETRY_DELAY=5000
   ENABLE_SCHEDULED_SYNC=true
   SCHEDULED_SYNC_CRON=0 */6 * * *
   ```

   :::info
   Replace `{SPACE_ID}` with your actual Storyblok space ID found in your space settings.
   :::

</TabItem>
</Tabs>

## Vendure Configuration

Configure your Vendure application to use the CMS Integration Plugin by modifying your `vendure-config.ts`:

```ts title="src/vendure-config.ts"
import { VendureConfig } from "@vendure/core";
// highlight-start
import { CmsPlugin } from "./plugins/cms/cms.plugin";
// highlight-end
import "dotenv/config";

export const config: VendureConfig = {
  // ... other configuration options

  plugins: [
    // highlight-start
    CmsPlugin.init({
      cmsApiUrl: process.env.CMS_API_URL,
      cmsApiKey: process.env.CMS_API_KEY,
      storyblokSpaceId: process.env.STORYBLOK_SPACE_ID,
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || "3"),
      retryDelay: parseInt(process.env.RETRY_DELAY || "5000"),
      enableScheduledSync: process.env.ENABLE_SCHEDULED_SYNC === "true",
      scheduledSyncCron: process.env.SCHEDULED_SYNC_CRON || "0 */6 * * *",
    }),
    // highlight-end

    // ... other plugins
  ],
};
```

## Environment Configuration

Create a `.env` file in your project root with your CMS platform configuration:

```bash title=".env"
# Basic Vendure Configuration
APP_ENV=dev
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
COOKIE_SECRET=your-cookie-secret-32-characters-min

# CMS Integration Configuration
CMS_API_URL=https://mapi.storyblok.com/v1/spaces/123456
CMS_API_KEY=your-cms-api-key
STORYBLOK_SPACE_ID=123456

# Sync Configuration
RETRY_ATTEMPTS=3
RETRY_DELAY=5000
ENABLE_SCHEDULED_SYNC=true
SCHEDULED_SYNC_CRON=0 */6 * * *
```

## Usage Examples

### Real-time Synchronization

The plugin automatically synchronizes data when Vendure entities are created, updated, or deleted:

```ts title="Example: Product Creation Sync"
// When a product is created in Vendure, it automatically triggers:
// 1. ProductEvent is emitted by Vendure core
// 2. CMS Plugin captures the event via EventBus subscription
// 3. Sync job is queued for asynchronous processing
// 4. Product data is transformed and sent to CMS platform

const product = await this.productService.create(ctx, {
  translations: [
    {
      languageCode: LanguageCode.en,
      name: "Wireless Headphones",
      description: "Premium wireless headphones with noise cancellation",
    },
  ],
});

// Product automatically synced to CMS via event-driven architecture
// rest of the implementation for ProductVariant and Collection...
```

### Manual Sync Operations

Use the Admin API for manual synchronization:

```graphql
# GraphQL mutation for manual product sync
mutation SyncProductToCms($productId: ID!) {
  syncProductToCms(productId: $productId) {
    success
    message
    timestamp
  }
}
```

### Batch Synchronization

Perform bulk synchronization operations:

```ts title="Example: Batch Collection Sync"
// Sync all collections to CMS
const result = await this.cmsSyncService.syncAllCollectionsToCms();

// Sync specific entity by ID
const syncResult = await this.cmsSyncService.syncProductToCms({
  entityType: "Product",
  entityId: productId,
  operationType: "create",
  timestamp: new Date().toISOString(),
  retryCount: 0,
});
```

## Architecture

### Event-Driven Synchronization

The plugin uses Vendure's EventBus system to capture entity changes in real-time:

- **ProductEvent**: Captures product creation, updates, and deletions
- **ProductVariantEvent**: Handles variant-level changes
- **CollectionEvent**: Manages collection modifications

### Job Queue Processing

Asynchronous job queues ensure reliable data synchronization:

- **cms-product-sync**: Handles product synchronization jobs
- **cms-variant-sync**: Processes variant synchronization
- **cms-collection-sync**: Manages collection sync operations

### Error Handling and Retry Logic

Built-in resilience mechanisms:

- Configurable retry attempts with exponential backoff
- Comprehensive error logging and monitoring
- Dead letter queue handling for failed synchronizations

### Rate Limiting

Prevents API rate limiting issues:

- Configurable request delays between sync operations
- Batch processing for large dataset synchronization
- Respect for CMS platform rate limits

## Customization

### Adding New CMS Platforms

Extend the plugin for additional CMS providers:

```ts title="src/plugins/cms/services/custom-cms.service.ts"
@Injectable()
export class CustomCmsService implements CmsServiceInterface {
  async syncProduct(productData: ProductData): Promise<SyncResponse> {
    // Implement custom CMS synchronization logic
    // Transform Vendure product data to CMS format
    // Handle API communication and error handling
  }

  // rest of the implementation for syncVariant and syncCollection...
}
```

### Custom Field Mapping

Configure field mappings between Vendure and your CMS:

```ts title="Custom field transformation example"
private transformProductData(product: Product): CmsProductData {
  return {
    name: product.name,
    description: product.description,
    slug: product.slug,
    // Custom field mappings
    cms_category: this.mapVendureCollectionToCmsCategory(product.collections),
    cms_price: this.formatPriceForCms(product.variants[0]?.price),
    // ... additional field transformations
  };
}
```

### Event Filtering

Customize which events trigger synchronization:

```ts title="Event filtering configuration"
// Override event handling in plugin configuration
CmsPlugin.init({
  // ... other options
  syncFilters: {
    products: (event: ProductEvent) => {
      // Only sync published products
      return event.entity.enabled === true;
    },
    collections: (event: CollectionEvent) => {
      // Skip private collections
      return !event.entity.isPrivate;
    },
  },
});
```

## Integration with Content Management

### Content Strategy

Best practices for CMS integration:

1. **Unified Content Model**: Design content types that reflect your e-commerce structure
2. **Bidirectional Sync**: Consider implementing CMS-to-Vendure synchronization for content updates
3. **Asset Management**: Coordinate asset storage between Vendure and CMS platforms
4. **SEO Optimization**: Leverage CMS capabilities for enhanced SEO content management

### Performance Considerations

- **Selective Sync**: Configure which entities and fields to synchronize
- **Batching**: Use batch operations for initial data migrations
- **Caching**: Implement caching strategies for frequently accessed content
- **Monitoring**: Set up monitoring for sync operation performance and success rates

## Troubleshooting

### Common Issues

1. **"Authentication Failed" Errors**:
   - Verify API keys are correctly set in environment variables
   - Check API key permissions in your CMS platform
   - Ensure API endpoints are accessible from your server environment

2. **"Sync Job Failed" Errors**:
   - Review job queue logs for specific error messages
   - Check network connectivity to CMS platform
   - Verify CMS platform service status

3. **"Rate Limit Exceeded" Errors**:
   - Increase `RETRY_DELAY` configuration value
   - Reduce concurrent sync operations
   - Check CMS platform rate limiting policies

4. **"Data Transformation Errors"**:
   - Verify field mappings match CMS content type schema
   - Check for required fields in CMS content types
   - Review data validation requirements

### Debugging

Enable detailed logging for troubleshooting:

```bash
# Enable debug logging
DEBUG=vendure:cms*
LOG_LEVEL=debug
```

Monitor job queue status through Vendure Admin UI:

- Navigate to "System" → "Job Queues"
- Monitor cms-\*-sync queue status
- Review failed job details and error messages

## Conclusion

The CMS Integration Plugin provides a robust foundation for synchronizing e-commerce data with modern headless CMS platforms. Its event-driven architecture ensures real-time consistency while job queue processing provides reliability and scalability.

Key benefits include:

- **Seamless Integration**: Automatic synchronization with minimal configuration
- **Production Ready**: Built-in error handling, retry logic, and monitoring
- **Extensible Architecture**: Easy to add support for additional CMS platforms
- **Performance Optimized**: Rate limiting and batching for large-scale operations

## Next Steps

- Configure webhook endpoints for bidirectional synchronization
- Implement custom field mappings for your specific content model
- Set up monitoring and alerting for sync operations
- Consider implementing asset synchronization workflows
- Explore advanced features like conflict resolution and merge strategies

## Platform-Specific Documentation

Detailed platform-specific guides and examples will be added as support for additional CMS platforms is implemented:

- **Contentful Integration** (Coming Soon)
- **Strapi Integration** (Coming Soon)
- **Sanity Integration** (Coming Soon)
- **Ghost Integration** (Coming Soon)

For questions, issues, or contributions, please refer to the project documentation or create an issue in the repository.
