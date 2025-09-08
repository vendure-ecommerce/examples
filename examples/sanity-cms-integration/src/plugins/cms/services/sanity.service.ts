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

const DOCUMENT_TYPE = {
  product: "vendureProduct",
  product_variant: "vendureProductVariant",
  collection: "vendureCollection",
};

@Injectable()
export class SanityService implements OnApplicationBootstrap {
  private readonly translationUtils = new TranslationUtils();
  private readonly rateLimitDelay = 20;
  private requestQueue: Promise<void> = Promise.resolve();

  private get sanityBaseUrl(): string {
    return `https://${this.options.sanityProjectId}.api.sanity.io/v2025-09-01`;
  }

  constructor(
    private connection: TransactionalConnection,
    private processContext: ProcessContext,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  async onApplicationBootstrap() {
    // No content type creation needed for Sanity
  }

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

      Logger.info(`Syncing product ${product.id} (${operationType}) to Sanity`);

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
        `Successfully synced product ${product.id} (${operationType}) to Sanity`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product ${product.id} (${operationType}) to Sanity: ${errorMessage}`,
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
        `Syncing product variant ${variant.id} (${operationType}) to Sanity`,
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
        `Successfully synced product variant ${variant.id} (${operationType}) to Sanity`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product variant ${variant.id} (${operationType}) to Sanity: ${errorMessage}`,
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
        `Syncing collection ${collection.id} (${operationType}) to Sanity`,
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
          await this.deleteDocumentFromCollection(
            collection,
            defaultLanguageCode,
          );
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced collection ${collection.id} (${operationType}) to Sanity`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync collection ${collection.id} (${operationType}) to Sanity: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async findDocumentByVendureId(
    vendureId: string | number,
    type: string,
  ): Promise<any> {
    try {
      const query = `*[_type == "${type}" && vendureId == ${vendureId}][0]`;
      const response = await this.makeSanityRequest({
        method: "GET",
        endpoint: `data/query/${this.options.sanityDataset || "production"}?query=${encodeURIComponent(query)}`,
      });

      return response.result;
    } catch (error) {
      Logger.error(
        `Failed to find document by vendure ID: ${vendureId}`,
        String(error),
      );
      return null;
    }
  }

  private async findDocumentsByVendureIds(
    vendureIds: (string | number)[],
    type: string,
  ): Promise<Map<string, any>> {
    const documentMap = new Map<string, any>();

    if (vendureIds.length === 0) {
      return documentMap;
    }

    try {
      const idsFilter = vendureIds
        .map((id) => `vendureId == ${id}`)
        .join(" || ");
      const query = `*[_type == "${type}" && (${idsFilter})]`;
      const response = await this.makeSanityRequest({
        method: "GET",
        endpoint: `data/query/${this.options.sanityDataset || "production"}?query=${encodeURIComponent(query)}`,
      });

      if (response.result) {
        for (const doc of response.result) {
          documentMap.set(doc.vendureId.toString(), doc);
        }
      }
    } catch (error) {
      Logger.error(
        `Failed to find documents by vendure IDs: ${vendureIds.join(", ")}`,
        String(error),
      );
    }

    return documentMap;
  }

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

  private async findVariantDocumentsForProduct(
    productId: string | number,
    defaultLanguageCode: LanguageCode,
    productSlug?: string | null,
  ): Promise<string[]> {
    if (!productSlug) {
      return [];
    }

    const variants = await this.findProductVariants(productId);
    const variantIds = variants.map((v) => v.id);

    if (variantIds.length === 0) {
      return [];
    }

    const documentsMap = await this.findDocumentsByVendureIds(
      variantIds,
      DOCUMENT_TYPE.product_variant,
    );

    const documentIds: string[] = [];
    for (const [vendureId, doc] of documentsMap) {
      if (doc?._id) {
        documentIds.push(doc._id);
      }
    }

    return documentIds;
  }

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

      const document = await this.findDocumentByVendureId(
        product.id,
        DOCUMENT_TYPE.product,
      );
      return document?._id || null;
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
    try {
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

      const result = await this.makeSanityRequest({
        method: "POST",
        endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
        data: { mutations: [{ create: data }] },
      });

      Logger.info(
        `Successfully created document for product ${product.id} with Sanity ID: ${result.results?.[0]?.id}`,
      );
    } catch (error) {
      Logger.error(
        `Failed to create document for product ${product.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async updateDocumentFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
    productSlug?: string | null,
  ): Promise<void> {
    const existingDocument = await this.findDocumentByVendureId(
      product.id,
      DOCUMENT_TYPE.product,
    );

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Sanity for product ${product.id}. Creating new document instead.`,
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

    await this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
      data: { mutations: [{ patch: { id: existingDocument._id, set: data } }] },
    });

    Logger.info(
      `Updated document for product ${product.id} (Sanity ID: ${existingDocument._id})`,
    );
  }

  private async deleteDocumentFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const existingDocument = await this.findDocumentByVendureId(
      product.id,
      DOCUMENT_TYPE.product,
    );

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Sanity for product ${product.id}, nothing to delete`,
      );
      return;
    }

    await this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
      data: { mutations: [{ delete: { id: existingDocument._id } }] },
    });

    Logger.info(
      `Deleted document for product ${product.id} (Sanity ID: ${existingDocument._id})`,
    );
  }

  private async createDocumentFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ): Promise<void> {
    try {
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

      const result = await this.makeSanityRequest({
        method: "POST",
        endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
        data: { mutations: [{ create: data }] },
      });

      Logger.info(
        `Successfully created document for variant ${variant.id} with Sanity ID: ${result.results?.[0]?.id}`,
      );
    } catch (error) {
      Logger.error(
        `Failed to create document for variant ${variant.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async updateDocumentFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ): Promise<void> {
    const existingDocument = await this.findDocumentByVendureId(
      variant.id,
      DOCUMENT_TYPE.product_variant,
    );

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Sanity for variant ${variant.id}. Creating new document instead.`,
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

    await this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
      data: { mutations: [{ patch: { id: existingDocument._id, set: data } }] },
    });

    Logger.info(
      `Updated document for variant ${variant.id} (Sanity ID: ${existingDocument._id})`,
    );
  }

  private async deleteDocumentFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
  ): Promise<void> {
    const existingDocument = await this.findDocumentByVendureId(
      variant.id,
      DOCUMENT_TYPE.product_variant,
    );

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Sanity for variant ${variant.id}, nothing to delete`,
      );
      return;
    }

    await this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
      data: { mutations: [{ delete: { id: existingDocument._id } }] },
    });

    Logger.info(
      `Deleted document for variant ${variant.id} (Sanity ID: ${existingDocument._id})`,
    );
  }

  private async createDocumentFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
    collectionSlug?: string | null,
    variants?: ProductVariant[],
  ): Promise<void> {
    try {
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

      const result = await this.makeSanityRequest({
        method: "POST",
        endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
        data: { mutations: [{ create: data }] },
      });

      Logger.info(
        `Successfully created document for collection ${collection.id} with Sanity ID: ${result.results?.[0]?.id}`,
      );
    } catch (error) {
      Logger.error(
        `Failed to create document for collection ${collection.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async updateDocumentFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
    collectionSlug?: string | null,
    variants?: ProductVariant[],
  ): Promise<void> {
    const existingDocument = await this.findDocumentByVendureId(
      collection.id,
      DOCUMENT_TYPE.collection,
    );

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Sanity for collection ${collection.id}. Creating new document instead.`,
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

    await this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
      data: { mutations: [{ patch: { id: existingDocument._id, set: data } }] },
    });

    Logger.info(
      `Updated document for collection ${collection.id} (Sanity ID: ${existingDocument._id})`,
    );
  }

  private async deleteDocumentFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const existingDocument = await this.findDocumentByVendureId(
      collection.id,
      DOCUMENT_TYPE.collection,
    );

    if (!existingDocument) {
      Logger.warn(
        `Document not found in Sanity for collection ${collection.id}, nothing to delete`,
      );
      return;
    }

    await this.makeSanityRequest({
      method: "POST",
      endpoint: `data/mutate/${this.options.sanityDataset || "production"}`,
      data: { mutations: [{ delete: { id: existingDocument._id } }] },
    });

    Logger.info(
      `Deleted document for collection ${collection.id} (Sanity ID: ${existingDocument._id})`,
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

    // Run parent product and collection lookups in parallel
    const [parentProductDocumentId, collectionDocumentIds] = await Promise.all([
      this.findParentProductDocumentId(variant, defaultLanguageCode),
      this.getCollectionDocumentIds(collections),
    ]);

    const result = {
      _type: DOCUMENT_TYPE.product_variant,
      vendureId: parseInt(variant.id.toString()),
      title: defaultTranslation?.name,
      slug: {
        current: variantSlug,
      },
      vendureProduct: parentProductDocumentId
        ? {
            _type: "reference",
            _ref: parentProductDocumentId,
          }
        : undefined,
      vendureCollecitons: collectionDocumentIds.map((id) => ({
        _key: `collection-${id}`,
        _type: "reference",
        _ref: id,
      })),
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

    const variantDocumentIds = await this.findVariantDocumentsForProduct(
      product.id,
      defaultLanguageCode,
      productSlug,
    );

    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );

    const result = {
      _type: DOCUMENT_TYPE.product,
      vendureId: parseInt(product.id.toString()),
      title: defaultTranslation?.name,
      slug: {
        current: slug,
      },
      vendureVariants: variantDocumentIds.map((id) => ({
        _key: `variant-${id}`,
        _type: "reference",
        _ref: id,
      })),
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

    const variantDocumentIds: string[] = [];
    if (variants && variants.length > 0) {
      const variantIds = variants.map((v) => v.id);
      const documentsMap = await this.findDocumentsByVendureIds(
        variantIds,
        DOCUMENT_TYPE.product_variant,
      );

      for (const [vendureId, doc] of documentsMap) {
        if (doc?._id) {
          variantDocumentIds.push(doc._id);
        }
      }
    }

    const result = {
      _type: DOCUMENT_TYPE.collection,
      vendureId: parseInt(collection.id.toString()),
      title: defaultTranslation?.name,
      slug: {
        current: slug,
      },
      vendureProductVariants: variantDocumentIds.map((id) => ({
        _key: `variant-${id}`,
        _type: "reference",
        _ref: id,
      })),
    };

    return result;
  }

  private async getCollectionDocumentIds(collections?: Collection[]): Promise<string[]> {
    if (!collections || collections.length === 0) {
      return [];
    }

    const collectionIds = collections.map((c) => c.id);
    const documentsMap = await this.findDocumentsByVendureIds(
      collectionIds,
      DOCUMENT_TYPE.collection,
    );

    const documentIds: string[] = [];
    for (const [vendureId, doc] of documentsMap) {
      if (doc?._id) {
        documentIds.push(doc._id);
      }
    }
    return documentIds;
  }

  private getSanityHeaders(): Record<string, string> {
    if (!this.options.sanityApiKey) {
      Logger.error("Sanity API key is not configured");
    }

    return {
      Authorization: `Bearer ${this.options.sanityApiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async enforceRateLimit(): Promise<void> {
    // Create a new promise that waits for the current queue + rate limit delay
    const currentRequest = this.requestQueue.then(async () => {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
    });
    
    // Update the queue to point to this request
    this.requestQueue = currentRequest;
    
    // Wait for our turn
    await currentRequest;
  }

  private async makeSanityRequest({
    method,
    endpoint,
    data,
  }: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
    data?: any;
  }): Promise<any> {
    const url = `${this.sanityBaseUrl}/${endpoint}`;
    const config: RequestInit = {
      method,
      headers: this.getSanityHeaders(),
    };

    if (data && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(data);
    }

    await this.enforceRateLimit();

    Logger.debug(`Making Sanity API request: ${method} ${url}`);
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Sanity API error: ${response.status} ${response.statusText} - ${errorText}`;
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (method === "DELETE") {
      return {};
    }

    return await response.json();
  }
}
