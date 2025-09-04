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
  product: "vendure-product",
  product_variant: "vendure-product-variant",
  collection: "vendure-collection",
};

@Injectable()
export class PayloadService {
  private readonly payloadBaseUrl = "http://localhost:3001/api";
  private isInitialized = true; // Payload doesn't need initialization like Storyblok
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
        `Syncing product ${product.id} (${operationType}) to Payload`,
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
        `Successfully synced product ${product.id} (${operationType}) to Payload`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product ${product.id} (${operationType}) to Payload: ${errorMessage}`,
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
        `Syncing product variant ${variant.id} (${operationType}) to Payload`,
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
        `Successfully synced product variant ${variant.id} (${operationType}) to Payload`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product variant ${variant.id} (${operationType}) to Payload: ${errorMessage}`,
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
        `Syncing collection ${collection.id} (${operationType}) to Payload`,
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
        `Successfully synced collection ${collection.id} (${operationType}) to Payload`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync collection ${collection.id} (${operationType}) to Payload: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Finds a Payload document by slug in a specific collection
   * @param collectionSlug The collection to search in
   * @param slug The slug to search for
   * @returns The document object or null if not found
   */
  private async findDocumentBySlug(collectionSlug: string, slug: string): Promise<any> {
    try {
      const response = await this.makePayloadRequest({
        method: "GET",
        endpoint: `${collectionSlug}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
      });

      return response.docs && response.docs.length > 0 ? response.docs[0] : null;
    } catch (error) {
      Logger.error(`Failed to find document by slug: ${slug}`, String(error));
      return null;
    }
  }

  /**
   * Finds multiple Payload documents by slugs across collections
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
      // Payload supports "in" operator for multiple values
      const slugsParam = slugs.map(slug => encodeURIComponent(slug)).join(',');
      const response = await this.makePayloadRequest({
        method: "GET",
        endpoint: `${collectionSlug}?where[slug][in]=${slugsParam}`,
      });

      if (response.docs) {
        for (const doc of response.docs) {
          documentMap.set(doc.slug, doc);
        }
      }
    } catch (error) {
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
    const data = await this.transformProductData(
      product,
      defaultLanguageCode,
      productSlug,
    );
    if (!data) {
      Logger.error(
        `Cannot create document: no valid translation data for product ${product.id}`,
      );
      return;
    }

    const result = await this.makePayloadRequest({
      method: "POST",
      endpoint: COLLECTION_SLUG.product,
      data,
    });

    Logger.info(
      `Created document for product ${product.id} with Payload ID: ${result.doc?.id}`,
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
        `Document not found in Payload for slug: ${slug}. Creating new document instead.`,
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

    await this.makePayloadRequest({
      method: "PATCH",
      endpoint: `${COLLECTION_SLUG.product}/${existingDocument.id}`,
      data,
    });

    Logger.info(
      `Updated document for product ${product.id} (Payload ID: ${existingDocument.id})`,
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
        `Document not found in Payload for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    await this.makePayloadRequest({
      method: "DELETE",
      endpoint: `${COLLECTION_SLUG.product}/${existingDocument.id}`,
    });

    Logger.info(
      `Deleted document for product ${product.id} (Payload ID: ${existingDocument.id})`,
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

    const result = await this.makePayloadRequest({
      method: "POST",
      endpoint: COLLECTION_SLUG.product_variant,
      data,
    });

    Logger.info(
      `Created document for variant ${variant.id} with Payload ID: ${result.doc?.id}`,
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

    await this.makePayloadRequest({
      method: "PATCH",
      endpoint: `${COLLECTION_SLUG.product_variant}/${existingDocument.id}`,
      data,
    });

    Logger.info(
      `Updated document for variant ${variant.id} (Payload ID: ${existingDocument.id})`,
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

    await this.makePayloadRequest({
      method: "DELETE",
      endpoint: `${COLLECTION_SLUG.product_variant}/${existingDocument.id}`,
    });

    Logger.info(
      `Deleted document for variant ${variant.id} (Payload ID: ${existingDocument.id})`,
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

    const result = await this.makePayloadRequest({
      method: "POST",
      endpoint: COLLECTION_SLUG.collection,
      data,
    });

    Logger.info(
      `Created document for collection ${collection.id} with Payload ID: ${result.doc?.id}`,
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
        `Document not found in Payload for slug: ${slug}. Creating new document instead.`,
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

    await this.makePayloadRequest({
      method: "PATCH",
      endpoint: `${COLLECTION_SLUG.collection}/${existingDocument.id}`,
      data,
    });

    Logger.info(
      `Updated document for collection ${collection.id} (Payload ID: ${existingDocument.id})`,
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
        `Document not found in Payload for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    await this.makePayloadRequest({
      method: "DELETE",
      endpoint: `${COLLECTION_SLUG.collection}/${existingDocument.id}`,
    });

    Logger.info(
      `Deleted document for collection ${collection.id} (Payload ID: ${existingDocument.id})`,
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
      id: variant.id,
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
      id: product.id,
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
      id: collection.id,
      name: defaultTranslation?.name,
      slug: slug,
      productVariants: variantDocumentIds,
    };

    return result;
  }

  private async checkPayloadCollections() {
    try {
      // Check if Payload collections exist by attempting to query each one
      const collections = [COLLECTION_SLUG.product, COLLECTION_SLUG.product_variant, COLLECTION_SLUG.collection];
      const results: Record<string, boolean> = {};

      for (const collection of collections) {
        try {
          await this.makePayloadRequest({
            method: "GET",
            endpoint: `${collection}?limit=1`,
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
      Logger.error("Failed to check Payload collections", String(error));
      return {
        product: false,
        variant: false,
        collection: false,
      };
    }
  }

  private getPayloadHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if API key is configured
    if (this.options.cmsApiKey) {
      headers.Authorization = `Bearer ${this.options.cmsApiKey}`;
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
  private async makePayloadRequest({
    method,
    endpoint,
    data,
  }: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    endpoint: string;
    data?: any;
  }): Promise<any> {
    const url = `${this.payloadBaseUrl}/${endpoint}`;
    
    const config: RequestInit = {
      method,
      headers: this.getPayloadHeaders(),
    };

    if (data && (method === "POST" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    // Enforce rate limiting before making the request
    await this.enforceRateLimit();

    Logger.debug(`Making Payload API request: ${method} ${url}`);
    
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Payload API error: ${response.status} ${response.statusText} - ${errorText}`;
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (method === "DELETE") {
      return {}; // DELETE requests typically don't return content
    }

    const responseData = await response.json();
    return responseData;
  }
}
