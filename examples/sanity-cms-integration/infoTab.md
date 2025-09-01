# Sanity CMS Integration

This tab provides a complete guide for integrating Vendure with Sanity CMS, including setting up a Sanity Studio and implementing the synchronization service.

## Setting up Sanity Studio

### 1. Create a new Studio with Sanity CLI

Initialize your Sanity project using the CLI. Replace `hgw9gfg9` with your actual project ID:

```bash
npm create sanity@latest -- --project hgw9gfg9 --dataset production --template clean --typescript --output-path studio-vendure-plugin
cd studio-vendure-plugin
```

### 2. Run Sanity Studio locally

Start the development server:

```bash
npm run dev
```

### 3. Log in to the Studio

Open your browser to `http://localhost:3333` and log in using the same service (Google, GitHub, or email) that you used with the Sanity CLI.

## Defining Schema Types

### 1. Create Vendure-specific document types

Create the following schema files in your `schemaTypes` folder:

**vendureProductType.ts**
```ts
import {defineField, defineType} from 'sanity'

export const vendureProductType = defineType({
  name: 'vendureProduct',
  title: 'Vendure Product',
  type: 'document',
  fields: [
    defineField({
      name: 'vendureId',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'vendureVariants',
      type: 'array',
      of: [{type: 'reference', to: {type: 'vendureProductVariant'}}],
    }),
  ],
})
```

**vendureProductVariant.ts**
```ts
import {defineField, defineType} from 'sanity'

export const vendureProductVariant = defineType({
  name: 'vendureProductVariant',
  title: 'Vendure Product Variant',
  type: 'document',
  fields: [
    defineField({
      name: 'vendureId',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'vendureProduct',
      type: 'reference',
      to: [{type: 'vendureProduct'}],
    }),
    defineField({
      name: 'vendureCollecitons',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'vendureCollection'}]}],
    }),
  ],
})
```

**vendureCollection.ts**
```ts
import {defineField, defineType} from 'sanity'

export const vendureCollection = defineType({
  name: 'vendureCollection',
  title: 'Vendure Collection',
  type: 'document',
  fields: [
    defineField({
      name: 'vendureId',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'vendureProductVariants',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'vendureProductVariant'}]}],
    }),
  ],
})
```

### 2. Register the schema types

Update your `schemaTypes/index.ts` file:

```ts
import { vendureCollection } from './vendureCollection'
import { vendureProductType } from './vendureProductType'
import { vendureProductVariant } from './vendureProductVariant'

export const schemaTypes = [
  vendureCollection,
  vendureProductType,
  vendureProductVariant,
]
```

## The Sanity Service

### Implementation

The `SanityService` contains all logic specific to the Sanity API. Unlike Storyblok, Sanity doesn't require content type creation as schemas are defined in the Studio.

```ts title="src/plugins/cms/services/sanity.service.ts"
@Injectable()
export class SanityService implements OnApplicationBootstrap {
  private get sanityBaseUrl(): string {
    return `https://${this.options.sanityProjectId}.api.sanity.io/v2025-09-01`;
  }

  constructor(@Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions) {}

  async onApplicationBootstrap() {
    // No content type creation needed - handled by Studio schema
  }

  async syncProduct({ product, operationType }) {
    switch (operationType) {
      case "create": await this.createDocumentFromProduct(product); break;
      case "update": await this.updateDocumentFromProduct(product); break;
      case "delete": await this.deleteDocumentFromProduct(product); break;
    }
  }

  // implement syncProductVariant, syncCollection...

  private async makeSanityRequest({ method, endpoint, data }) {
    await this.enforceRateLimit();
    const url = `${this.sanityBaseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.sanityApiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Sanity API error: ${response.status}`);
    }

    return await response.json();
  }

  private async createDocumentFromProduct(product) {
    const data = this.transformProductData(product);
    return this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || 'production'}`,
      data: { mutations: [{ create: data }] },
    });
  }

  private transformProductData(product) {
    return {
      _type: 'vendureProduct',
      vendureId: parseInt(product.id.toString()),
      title: product.translations[0]?.name,
      slug: { current: product.translations[0]?.slug },
      // Add variant references as needed
    };
  }
}
```

## Configuration

Update your plugin configuration to include Sanity options:

```ts title="src/plugins/cms/types.ts"
export interface PluginInitOptions {
  // ... existing options
  sanityApiKey?: string;
  sanityProjectId?: string;
  sanityDataset?: string;
}
```

## Environment Variables

Add these to your `.env` file:

```env
SANITY_API_KEY=your_sanity_api_key
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
```

## Final Plugin Configuration

```ts title="src/vendure-config.ts"
CmsPlugin.init({
  sanityApiKey: process.env.SANITY_API_KEY,
  sanityProjectId: process.env.SANITY_PROJECT_ID,
  sanityDataset: process.env.SANITY_DATASET || 'production',
}),
```

This setup provides a complete Sanity CMS integration that automatically syncs your Vendure catalog with structured content in Sanity Studio.