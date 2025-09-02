import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import {
  LanguageCode,
  Product,
  ProductVariant,
  Collection,
  TransactionalConnection,
  ProcessContext,
  Logger,
} from "@vendure/core";
import { CMS_PLUGIN_OPTIONS } from "../constants";
import { OperationType, PluginInitOptions } from "../types";
import { TranslationUtils } from "../utils/translation.utils";
const COLLECTION_SLUG = {
  product: "vendure-products",
  product_variant: "vendure-product-variants",
  collection: "vendure-collections",
};

@Injectable()
export class StrapiService {
  private readonly strapiBaseUrl = "http://localhost:1337/api";
  private isInitialized = true; // Strapi doesn't need initialization like Storyblok
  private readonly translationUtils = new TranslationUtils();
  private lastApiCallTime = 0;
  private readonly rateLimitDelay = 100; // 100ms between calls for local API

  constructor(
    private connection: TransactionalConnection,
    private processContext: ProcessContext,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  async syncProduct({
    product,
    defaultLanguageCode,
    operationType,
    productSlug,
  }: {
    product: Product;
    defaultLanguageCode: LanguageCode;
    operationType: OperationType;
    productSlug?: string | null;
  }) {
    try {
      this.translationUtils.validateTranslations(
        product.translations,
        defaultLanguageCode,
      );

      Logger.info(
        `Syncing product ${product.id} (${operationType}) to Strapi`,
      );

      switch (operationType) {
        case "create":
          await this.createDocumentFromProduct(
            product,
            defaultLanguageCode,
            productSlug,
          );
          break;
        case "update":
          await this.updateDocumentFromProduct(
            product,
            defaultLanguageCode,
            productSlug,
          );
          break;
        case "delete":
          await this.deleteDocumentFromProduct(product, defaultLanguageCode);
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced product ${product.id} (${operationType}) to Strapi`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product ${product.id} (${operationType}) to Strapi: ${errorMessage}`,
      );
      throw error;
    }
  }

  async syncProductVariant({
    variant,
    defaultLanguageCode,
    operationType,
    variantSlug,
    collections,
  }: {
    variant: ProductVariant;
    defaultLanguageCode: LanguageCode;
    operationType: OperationType;
    variantSlug: string;
    collections?: Collection[];
  }) {
    try {
      this.translationUtils.validateTranslations(
        variant.translations,
        defaultLanguageCode,
      );

      Logger.info(
        `Syncing product variant ${variant.id} (${operationType}) to Strapi`,
      );

      switch (operationType) {
        case "create":
          await this.createDocumentFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
            collections,
          );
          break;
        case "update":
          await this.updateDocumentFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
            collections,
          );
          break;
        case "delete":
          await this.deleteDocumentFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
          );
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced product variant ${variant.id} (${operationType}) to Strapi`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product variant ${variant.id} (${operationType}) to Strapi: ${errorMessage}`,
      );
      throw error;
    }
  }

  async syncCollection({
    collection,
    defaultLanguageCode,
    operationType,
    collectionSlug,
    variants,
  }: {
    collection: Collection;
    defaultLanguageCode: LanguageCode;
    operationType: OperationType;
    collectionSlug?: string | null;
    variants?: ProductVariant[];
  }) {
    try {
      this.translationUtils.validateTranslations(
        collection.translations,
        defaultLanguageCode,
      );

      Logger.info(
        `Syncing collection ${collection.id} (${operationType}) to Strapi`,
      );

      switch (operationType) {
        case "create":
          await this.createDocumentFromCollection(
            collection,
            defaultLanguageCode,
            collectionSlug,
            variants,
          );
          break;
        case "update":
          await this.updateDocumentFromCollection(
            collection,
            defaultLanguageCode,
            collectionSlug,
            variants,
          );
          break;
        case "delete":
          await this.deleteDocumentFromCollection(collection, defaultLanguageCode);
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced collection ${collection.id} (${operationType}) to Strapi`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync collection ${collection.id} (${operationType}) to Strapi: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Finds a Strapi document by slug in a specific collection
   * @param collectionSlug The collection to search in
   * @param slug The slug to search for
   * @returns The document object or null if not found
   */
  private async findDocumentBySlug(collectionSlug: string, slug: string): Promise<any> {
    try {
      const endpoint = `${collectionSlug}?filters[slug][\$eq]=${encodeURIComponent(slug)}&pagination[limit]=1`;
      console.log(`🔍 findDocumentBySlug - Looking for slug: "${slug}" in collection: "${collectionSlug}"`);
      console.log(`🔍 findDocumentBySlug - Full endpoint: "${endpoint}"`);
      
      const response = await this.makeStrapiRequest({
        method: "GET",
        endpoint,
      });

      console.log(`🔍 findDocumentBySlug - Response:`, JSON.stringify(response, null, 2));
      const result = response.data && response.data.length > 0 ? response.data[0] : null;
      console.log(`🔍 findDocumentBySlug - Returning:`, result ? `Found document with ID: ${result.id}` : 'null');
      
      return result;
    } catch (error) {
      console.log(`❌ findDocumentBySlug - Error for slug "${slug}":`, error);
      Logger.error(`Failed to find document by slug: ${slug}`, String(error));
      return null;
    }
  }

  /**
   * Finds multiple Strapi documents by slugs across collections
   * @param collectionSlug The collection to search in
   * @param slugs Array of slugs to search for
   * @returns Map of slug to document object
   */
  private async findDocumentsBySlugs(collectionSlug: string, slugs: string[]): Promise<Map<string, any>> {
    const documentMap = new Map<string, any>();

    if (slugs.length === 0) {
      return documentMap;
    }

    try {
      // Strapi supports "$in" operator for multiple values
      const slugsParam = slugs.map(slug => encodeURIComponent(slug)).join(',');
      const endpoint = `${collectionSlug}?filters[slug][\$in]=${slugsParam}`;
      
      console.log(`🔍 findDocumentsBySlugs - Looking for slugs:`, slugs);
      console.log(`🔍 findDocumentsBySlugs - Collection: "${collectionSlug}"`);
      console.log(`🔍 findDocumentsBySlugs - Full endpoint: "${endpoint}"`);
      
      const response = await this.makeStrapiRequest({
        method: "GET",
        endpoint,
      });

      console.log(`🔍 findDocumentsBySlugs - Response:`, JSON.stringify(response, null, 2));

      if (response.data) {
        for (const doc of response.data) {
          console.log(`🔍 findDocumentsBySlugs - Processing doc:`, { id: doc.id, slug: doc.slug });
          documentMap.set(doc.slug, doc);
        }
      }
      
      console.log(`🔍 findDocumentsBySlugs - Final documentMap size:`, documentMap.size);
    } catch (error) {
      console.log(`❌ findDocumentsBySlugs - Error:`, error);
      Logger.error(
        `Failed to find documents by slugs: ${slugs.join(", ")}`,
        String(error),
      );
    }

    return documentMap;
  }

  /**
   * Finds all product variants for a given product ID
   * @param productId The Vendure product ID
   * @returns Array of ProductVariant entities
   */
  private async findProductVariants(
    productId: string | number,
  ): Promise<ProductVariant[]> {
    try {
      const variants = await this.connection.rawConnection
        .getRepository(ProductVariant)
        .find({
          where: { productId: productId as any },
          relations: ["translations"],
          order: { id: "ASC" },
        });

      return variants;
    } catch (error) {
      Logger.error(
        `Failed to find variants for product ${productId}`,
        String(error),
      );
      return [];
    }
  }

  /**
   * Finds all Payload documents that represent variants of a product
   * @param productId The Vendure product ID
   * @param defaultLanguageCode The default language code to use for slug lookup
   * @returns Array of Payload document IDs
   */
  private async findVariantDocumentsForProductIds(
    productId: string | number,
    defaultLanguageCode: LanguageCode,
    productSlug?: string | null,
  ): Promise<string[]> {
    if (!productSlug) {
      return [];
    }

    const variants = await this.findProductVariants(productId);

    // Collect all variant slugs for batch lookup
    const variantSlugs = variants.map(
      (variant) => `${productSlug}-variant-${variant.id}`,
    );

    if (variantSlugs.length === 0) {
      return [];
    }

    // Batch lookup all variant documents at once
    const documentsMap = await this.findDocumentsBySlugs(COLLECTION_SLUG.product_variant, variantSlugs);

    const documentIds: string[] = [];
    documentsMap.forEach((doc, slug) => {
      if (doc?.id) {
        documentIds.push(doc.id.toString());
      }
    });

    return documentIds;
  }

  /**
   * Finds the parent product document for a given variant
   * @param variant The ProductVariant entity
   * @param defaultLanguageCode The default language code to use for slug lookup
   * @returns Payload document ID of the parent product or null
   */
  private async findParentProductDocumentId(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
  ): Promise<string | null> {
    try {
      const product = await this.connection.rawConnection
        .getRepository(Product)
        .findOne({
          where: { id: variant.productId },
          relations: ["translations"],
        });

      if (!product) {
        return null;
      }

      const slug = this.translationUtils.getSlugByLanguage(
        product.translations,
        defaultLanguageCode,
      );

      if (slug) {
        const document = await this.findDocumentBySlug(COLLECTION_SLUG.product, slug);
        return document?.id?.toString() || null;
      }

      return null;
    } catch (error) {
      Logger.error(
        `Failed to find parent product for variant ${variant.id}`,
        String(error),
      );
      return null;
    }
  }

  private async createDocumentFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
    productSlug?: string | null,
  ): Promise<void> {
    console.log(`📝 createDocumentFromProduct - Product ID: ${product.id}, Lang: ${defaultLanguageCode}, productSlug: ${productSlug}`);
    
    const data = await this.transformProductData(
      product,
      defaultLanguageCode,
      productSlug,
    );
    if (!data) {
      console.log(`❌ createDocumentFromProduct - No data returned from transformProductData`);
      Logger.error(
        `Cannot create document: no valid translation data for product ${product.id}`,
      );
      return;
    }

    console.log(`📝 createDocumentFromProduct - Transformed data:`, JSON.stringify(data, null, 2));
    console.log(`📝 createDocumentFromProduct - Making POST to: ${COLLECTION_SLUG.product}`);
    console.log(`📝 createDocumentFromProduct - Request payload:`, JSON.stringify({ data }, null, 2));

    const result = await this.makeStrapiRequest({
      method: "POST",
      endpoint: COLLECTION_SLUG.product,
      data: { data },
    });

    console.log(`✅ createDocumentFromProduct - Result:`, JSON.stringify(result, null, 2));
    Logger.info(
      `Created document for product ${product.id} with Strapi ID: ${result.data?.id}`,
    );
  }

  private async updateDocumentFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
    productSlug?: string | null,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );
    
    if (!slug) {
      Logger.error(
        `No slug found for product ${product.id} in language ${defaultLanguageCode}`,
      );
      return;
    }

    const existingDocument = await this.findDocumentBySlug(COLLECTION_SLUG.product, slug);

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Strapi for slug: ${slug}. Creating new document instead.`,
      );
      await this.createDocumentFromProduct(product, defaultLanguageCode);
      return;
    }

    const data = await this.transformProductData(
      product,
      defaultLanguageCode,
      productSlug,
    );
    
    if (!data) {
      Logger.error(
        `Cannot update document: no valid translation data for product ${product.id}`,
      );
      return;
    }

    await this.makeStrapiRequest({
      method: "PUT",
      endpoint: `${COLLECTION_SLUG.product}/${existingDocument.id}`,
      data: { data },
    });

    Logger.info(
      `Updated document for product ${product.id} (Strapi ID: ${existingDocument.id})`,
    );
  }

  private async deleteDocumentFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.warn(
        `No slug found for product ${product.id}, cannot delete document`,
      );
      return;
    }

    const existingDocument = await this.findDocumentBySlug(COLLECTION_SLUG.product, slug);

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Strapi for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    await this.makeStrapiRequest({
      method: "DELETE",
      endpoint: `${COLLECTION_SLUG.product}/${existingDocument.id}`,
    });

    Logger.info(
      `Deleted document for product ${product.id} (Strapi ID: ${existingDocument.id})`,
    );
  }

  // Variant-specific CRUD methods
  private async createDocumentFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ): Promise<void> {
    const data = await this.transformVariantData(
      variant,
      defaultLanguageCode,
      variantSlug,
      collections,
    );
    if (!data) {
      Logger.error(
        `Cannot create document: no valid translation data for variant ${variant.id}`,
      );
      return;
    }

    const result = await this.makeStrapiRequest({
      method: "POST",
      endpoint: COLLECTION_SLUG.product_variant,
      data: { data },
    });

    Logger.info(
      `Created document for variant ${variant.id} with Strapi ID: ${result.data?.id}`,
    );
  }

  private async updateDocumentFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ): Promise<void> {
    const existingDocument = await this.findDocumentBySlug(COLLECTION_SLUG.product_variant, variantSlug);

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Payload for slug: ${variantSlug}. Creating new document instead.`,
      );
      await this.createDocumentFromVariant(
        variant,
        defaultLanguageCode,
        variantSlug,
        collections,
      );
      return;
    }

    const data = await this.transformVariantData(
      variant,
      defaultLanguageCode,
      variantSlug,
      collections,
    );
    if (!data) {
      Logger.error(
        `Cannot update document: no valid translation data for variant ${variant.id}`,
      );
      return;
    }

    await this.makeStrapiRequest({
      method: "PUT",
      endpoint: `${COLLECTION_SLUG.product_variant}/${existingDocument.id}`,
      data: { data },
    });

    Logger.info(
      `Updated document for variant ${variant.id} (Strapi ID: ${existingDocument.id})`,
    );
  }

  private async deleteDocumentFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
  ): Promise<void> {
    const existingDocument = await this.findDocumentBySlug(COLLECTION_SLUG.product_variant, variantSlug);

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Payload for slug: ${variantSlug}, nothing to delete`,
      );
      return;
    }

    await this.makeStrapiRequest({
      method: "DELETE",
      endpoint: `${COLLECTION_SLUG.product_variant}/${existingDocument.id}`,
    });

    Logger.info(
      `Deleted document for variant ${variant.id} (Strapi ID: ${existingDocument.id})`,
    );
  }

  // Collection-specific CRUD methods
  private async createDocumentFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
    collectionSlug?: string | null,
    variants?: ProductVariant[],
  ): Promise<void> {
    const data = await this.transformCollectionData(
      collection,
      defaultLanguageCode,
      collectionSlug,
      variants,
    );
    if (!data) {
      Logger.error(
        `Cannot create document: no valid translation data for collection ${collection.id}`,
      );
      return;
    }

    const result = await this.makeStrapiRequest({
      method: "POST",
      endpoint: COLLECTION_SLUG.collection,
      data: { data },
    });

    Logger.info(
      `Created document for collection ${collection.id} with Strapi ID: ${result.data?.id}`,
    );
  }

  private async updateDocumentFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
    collectionSlug?: string | null,
    variants?: ProductVariant[],
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      collection.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.error(
        `No slug found for collection ${collection.id} in language ${defaultLanguageCode}`,
      );
      return;
    }

    const existingDocument = await this.findDocumentBySlug(COLLECTION_SLUG.collection, slug);

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Strapi for slug: ${slug}. Creating new document instead.`,
      );
      await this.createDocumentFromCollection(
        collection,
        defaultLanguageCode,
        collectionSlug,
        variants,
      );
      return;
    }

    const data = await this.transformCollectionData(
      collection,
      defaultLanguageCode,
      collectionSlug,
      variants,
    );
    if (!data) {
      Logger.error(
        `Cannot update document: no valid translation data for collection ${collection.id}`,
      );
      return;
    }

    await this.makeStrapiRequest({
      method: "PUT",
      endpoint: `${COLLECTION_SLUG.collection}/${existingDocument.id}`,
      data: { data },
    });

    Logger.info(
      `Updated document for collection ${collection.id} (Strapi ID: ${existingDocument.id})`,
    );
  }

  private async deleteDocumentFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      collection.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.warn(
        `No slug found for collection ${collection.id}, cannot delete document`,
      );
      return;
    }

    const existingDocument = await this.findDocumentBySlug(COLLECTION_SLUG.collection, slug);

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Strapi for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    await this.makeStrapiRequest({
      method: "DELETE",
      endpoint: `${COLLECTION_SLUG.collection}/${existingDocument.id}`,
    });

    Logger.info(
      `Deleted document for collection ${collection.id} (Strapi ID: ${existingDocument.id})`,
    );
  }

  private async transformVariantData(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ) {
    const defaultTranslation = this.translationUtils.getTranslationByLanguage(
      variant.translations,
      defaultLanguageCode,
    );

    if (!defaultTranslation) {
      Logger.warn(
        `No translation found for variant ${variant.id} in language ${defaultLanguageCode}`,
      );
      return undefined;
    }

    // Find parent product document for this variant
    const parentProductDocumentId = await this.findParentProductDocumentId(
      variant,
      defaultLanguageCode,
    );

    // Transform collections to document IDs
    const collectionDocumentIds: string[] = [];
    if (collections && collections.length > 0) {
      // Collect all collection slugs for batch lookup
      const collectionSlugs: string[] = [];
      for (const collection of collections) {
        const slug = this.translationUtils.getSlugByLanguage(
          collection.translations,
          defaultLanguageCode,
        );
        if (slug) {
          collectionSlugs.push(slug);
        }
      }

      // Batch lookup all collection documents at once
      if (collectionSlugs.length > 0) {
        const documentsMap = await this.findDocumentsBySlugs(COLLECTION_SLUG.collection, collectionSlugs);

        // Extract IDs from found documents
        documentsMap.forEach((doc, slug) => {
          if (doc?.id) {
            collectionDocumentIds.push(doc.id.toString());
          }
        });
      }
    }

    const result = {
      vendureId: variant.id,
      name: defaultTranslation?.name,
      slug: variantSlug,
      product: parentProductDocumentId || null,
      collections: collectionDocumentIds,
    };

    return result;
  }

  private async transformProductData(
    product: Product,
    defaultLanguageCode: LanguageCode,
    productSlug?: string | null,
  ) {
    const defaultTranslation = this.translationUtils.getTranslationByLanguage(
      product.translations,
      defaultLanguageCode,
    );

    if (!defaultTranslation) {
      Logger.warn(
        `No translation found for product ${product.id} in language ${defaultLanguageCode}`,
      );
      return undefined;
    }

    // Find all variant documents for this product
    const variantDocumentIds = await this.findVariantDocumentsForProductIds(
      product.id,
      defaultLanguageCode,
      productSlug,
    );

    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );

    const result = {
      vendureId: product.id,
      name: defaultTranslation?.name,
      slug: slug,
      productVariants: variantDocumentIds,
    };

    return result;
  }

  private async transformCollectionData(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
    collectionSlug?: string | null,
    variants?: ProductVariant[],
  ) {
    const defaultTranslation = this.translationUtils.getTranslationByLanguage(
      collection.translations,
      defaultLanguageCode,
    );

    if (!defaultTranslation) {
      Logger.warn(
        `No translation found for collection ${collection.id} in language ${defaultLanguageCode}`,
      );
      return undefined;
    }

    const slug = this.translationUtils.getSlugByLanguage(
      collection.translations,
      defaultLanguageCode,
    );

    // Transform variants to document IDs
    const variantDocumentIds: string[] = [];
    if (variants && variants.length > 0) {
      // First, collect all variant slugs we need to look up
      const variantSlugs: string[] = [];

      for (const variant of variants) {
        if (variant.product && variant.product.translations) {
          const productSlug = this.translationUtils.getSlugByLanguage(
            variant.product.translations,
            defaultLanguageCode,
          );

          if (productSlug) {
            const variantSlug = `${productSlug}-variant-${variant.id}`;
            variantSlugs.push(variantSlug);
          }
        }
      }

      // Batch lookup all variant documents at once
      if (variantSlugs.length > 0) {
        const documentsMap = await this.findDocumentsBySlugs(COLLECTION_SLUG.product_variant, variantSlugs);

        // Extract IDs from found documents
        documentsMap.forEach((doc, slug) => {
          if (doc?.id) {
            variantDocumentIds.push(doc.id.toString());
          }
        });
      }
    }

    const result = {
      vendureId: collection.id,
      name: defaultTranslation?.name,
      slug: slug,
      productVariants: variantDocumentIds,
    };

    return result;
  }

  private async checkStrapiCollections() {
    try {
      // Check if Strapi collections exist by attempting to query each one
      const collections = [COLLECTION_SLUG.product, COLLECTION_SLUG.product_variant, COLLECTION_SLUG.collection];
      const results: Record<string, boolean> = {};

      for (const collection of collections) {
        try {
          await this.makeStrapiRequest({
            method: "GET",
            endpoint: `${collection}?pagination[limit]=1`,
          });
          results[collection] = true;
        } catch (error) {
          results[collection] = false;
        }
      }

      return {
        product: results[COLLECTION_SLUG.product],
        variant: results[COLLECTION_SLUG.product_variant],
        collection: results[COLLECTION_SLUG.collection],
      };
    } catch (error) {
      Logger.error("Failed to check Strapi collections", String(error));
      return {
        product: false,
        variant: false,
        collection: false,
      };
    }
  }

  private getStrapiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    console.log(`🔑 getStrapiHeaders - API Key configured:`, !!this.options.cmsApiKey);
    console.log(`🔑 getStrapiHeaders - API Key length:`, this.options.cmsApiKey?.length || 0);
    console.log(`🔑 getStrapiHeaders - API Key preview:`, this.options.cmsApiKey?.substring(0, 20) + '...' || 'NOT SET');

    // Add authorization header if API key is configured
    if (this.options.cmsApiKey) {
      headers.Authorization = `Bearer ${this.options.cmsApiKey}`;
      console.log(`🔑 getStrapiHeaders - Authorization header added`);
    } else {
      console.log(`❌ getStrapiHeaders - NO API KEY CONFIGURED!`);
    }

    return headers;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTime;

    if (timeSinceLastCall < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastApiCallTime = Date.now();
  }
  private async makeStrapiRequest({
    method,
    endpoint,
    data,
  }: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
    data?: any;
  }): Promise<any> {
    const url = `${this.strapiBaseUrl}/${endpoint}`;
    
    console.log(`🌐 makeStrapiRequest - ${method} ${url}`);
    console.log(`🌐 makeStrapiRequest - Headers:`, this.getStrapiHeaders());
    if (data) {
      console.log(`🌐 makeStrapiRequest - Body:`, JSON.stringify(data, null, 2));
    }
    
    const config: RequestInit = {
      method,
      headers: this.getStrapiHeaders(),
    };

    if (data && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(data);
    }

    // Enforce rate limiting before making the request
    await this.enforceRateLimit();

    Logger.debug(`Making Strapi API request: ${method} ${url}`);
    
    const response = await fetch(url, config);

    console.log(`🌐 makeStrapiRequest - Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Strapi API error: ${response.status} ${response.statusText} - ${errorText}`;
      console.log(`❌ makeStrapiRequest - Error response:`, errorText);
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (method === "DELETE") {
      return {}; // DELETE requests typically don't return content
    }

    const responseData = await response.json();
    console.log(`🌐 makeStrapiRequest - Response data:`, JSON.stringify(responseData, null, 2));
    return responseData;
  }
}
