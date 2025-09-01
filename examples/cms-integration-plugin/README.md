# CMS Integration Shop

A Vendure example demonstrating CMS integration using the "Sync with Reference" pattern.

This example implements event-driven synchronization where Vendure remains the single source of truth for commerce data while the CMS owns content enrichment.

This is a bare-bones project was generated with [`@vendure/create`](https://github.com/vendure-ecommerce/vendure/tree/publish/packages/create) with a custom CMS plugin.

## Overview

This implementation showcases:

- **Event-driven Product sync** using Vendure's EventBus system
- **Job queue usage** with proper error handling and retry logic
- **Production-ready architecture** with configurable options
- **Comprehensive logging** for debugging and monitoring

## Useful Links

- [Vendure docs](https://www.vendure.io/docs)
- [Vendure Discord community](https://www.vendure.io/community)
- [Vendure on GitHub](https://github.com/vendure-ecommerce/vendure)
- [Vendure plugin template](https://github.com/vendure-ecommerce/plugin-template)

## Directory structure

- `/src` contains the source code of your Vendure server. All your custom code and plugins should reside here.
- `/src/plugins/cms/` contains the CMS integration plugin implementation
- `/static` contains static (non-code) files such as assets (e.g. uploaded images) and email templates.

## CMS Plugin Architecture

### Event-Driven Sync Flow

```
ProductEvent → Event Listener → Job Queue → CMS Sync Service → External CMS API
     ↓              ↓               ↓              ↓                    ↓
  Product        Extract         Queue         Process            API Call
  Created/       Sync Data       Job for       Sync Job           to CMS
  Updated/                       Async         with Retry
  Deleted                        Processing    Logic
```

### Core Components

#### 1. CMS Plugin (`src/plugins/cms/cms.plugin.ts`)

- **Event Listeners**: Subscribes to `ProductEvent` for real-time sync
- **Job Queue Management**: Creates and manages async job processing
- **Data Extraction**: Transforms Vendure product data for CMS consumption

#### 2. CMS Sync Service (`src/plugins/cms/cms-sync.service.ts`)

- **API Integration**: Handles actual CMS API call orchestration logic (currently logging for demo)
- **Error Handling**: Error catching and reporting
- **Retry Logic**: Built-in retry mechanism through job queue

#### 3. Type Definitions (`src/plugins/cms/types.ts`)

- **SyncJobData**: Job payload structure for queue processing
- **PluginInitOptions**: Configuration options for the plugin
- **SyncResponse**: Response format for sync operations

### Sync Data Structure

For each product event, the following data structure is created:

```typescript
{
  entityType: 'product',
  entityId: '1',
  operationType: 'create' | 'update' | 'delete',
  vendureData: {
    id: '1',
    title: 'Sample Product',
    slug: 'sample-product',
    translations: [
      {
        languageCode: 'en',
        name: 'Sample Product',
        slug: 'sample-product'
      }
    ]
  },
  timestamp: '2025-08-27T10:53:00.000Z',
  retryCount: 0
}
```

This data is then processed by a CMS-specific Sync Service, which makes the API calls to the CMS.
