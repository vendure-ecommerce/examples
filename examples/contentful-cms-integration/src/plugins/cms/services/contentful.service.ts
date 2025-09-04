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

const CONTENT_TYPE_ID = {
  product: "vendureProduct",
  product_variant: "vendureProductVariant",
  collection: "vendureCollection",
};

@Injectable()
export class ContentfulService implements OnApplicationBootstrap {
  private readonly contentfulBaseUrl = "https://api.contentful.com";
  private readonly contentTypesPath = "content_types";
  private readonly entriesPath = "entries";
  private isInitialized = false;
  private readonly translationUtils = new TranslationUtils();
  private lastApiCallTime = 0;
  private readonly rateLimitDelay = 50; // 150ms between calls, adjust as needed
  constructor(
    private connection: TransactionalConnection,
    private processContext: ProcessContext,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  async onApplicationBootstrap() {
    this.ensureContentfulContentTypesExists();
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

      Logger.info(
        `Syncing product ${product.id} (${operationType}) to Contentful`,
      );

      switch (operationType) {
        case "create":
          await this.createEntryFromProduct(
            product,
            defaultLanguageCode,
            productSlug,
          );
          break;
        case "update":
          await this.updateEntryFromProduct(
            product,
            defaultLanguageCode,
            productSlug,
          );
          break;
        case "delete":
          await this.deleteEntryFromProduct(product, defaultLanguageCode);
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced product ${product.id} (${operationType}) to Contentful`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product ${product.id} (${operationType}) to Contentful: ${errorMessage}`,
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
        `Syncing product variant ${variant.id} (${operationType}) to Contentful`,
      );

      switch (operationType) {
        case "create":
          await this.createEntryFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
            collections,
          );
          break;
        case "update":
          await this.updateEntryFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
            collections,
          );
          break;
        case "delete":
          await this.deleteEntryFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
          );
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced product variant ${variant.id} (${operationType}) to Contentful`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product variant ${variant.id} (${operationType}) to Contentful: ${errorMessage}`,
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
        `Syncing collection ${collection.id} (${operationType}) to Contentful`,
      );

      switch (operationType) {
        case "create":
          await this.createEntryFromCollection(
            collection,
            defaultLanguageCode,
            collectionSlug,
            variants,
          );
          break;
        case "update":
          await this.updateEntryFromCollection(
            collection,
            defaultLanguageCode,
            collectionSlug,
            variants,
          );
          break;
        case "delete":
          await this.deleteEntryFromCollection(collection, defaultLanguageCode);
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced collection ${collection.id} (${operationType}) to Contentful`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync collection ${collection.id} (${operationType}) to Contentful: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Finds a Contentful entry by field value
   * @param contentTypeId The content type ID to filter by
   * @param fieldName The field name to search on
   * @param fieldValue The field value to search for
   * @returns The entry object or null if not found
   */
  private async findEntryByField(
    contentTypeId: string,
    fieldName: string,
    fieldValue: string,
  ): Promise<any> {
    try {
      const response = await this.makeContentfulRequest({
        method: "GET",
        endpoint: `${this.entriesPath}?content_type=${contentTypeId}&fields.${fieldName}=${encodeURIComponent(fieldValue)}`,
      });

      return response.items && response.items.length > 0
        ? response.items[0]
        : null;
    } catch (error) {
      Logger.error(
        `Failed to find entry by field ${fieldName}: ${fieldValue}`,
        String(error),
      );
      return null;
    }
  }

  /**
   * Finds multiple Contentful entries by field values in a single API call
   * @param contentTypeId The content type ID to filter by
   * @param fieldName The field name to search on
   * @param fieldValues Array of field values to search for
   * @returns Map of field value to entry object
   */
  private async findEntriesByField(
    contentTypeId: string,
    fieldName: string,
    fieldValues: string[],
  ): Promise<Map<string, any>> {
    const entryMap = new Map<string, any>();

    if (fieldValues.length === 0) {
      return entryMap;
    }

    try {
      // Contentful supports comma-separated values for "in" queries
      const valuesParam = fieldValues
        .map((v) => encodeURIComponent(v))
        .join(",");
      const response = await this.makeContentfulRequest({
        method: "GET",
        endpoint: `${this.entriesPath}?content_type=${contentTypeId}&fields.${fieldName}[in]=${valuesParam}`,
      });

      if (response.items) {
        for (const item of response.items) {
          const fieldValue = item.fields[fieldName];
          if (fieldValue) {
            entryMap.set(fieldValue, item);
          }
        }
      }
    } catch (error) {
      Logger.error(
        `Failed to find entries by field ${fieldName}: ${fieldValues.join(", ")}`,
        String(error),
      );
    }

    return entryMap;
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
   * Finds all Contentful entries that represent variants of a product
   * @param productId The Vendure product ID
   * @param defaultLanguageCode The default language code to use for slug lookup
   * @returns Array of Contentful entry IDs
   */
  private async findVariantEntriesForProductIds(
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

    // Batch lookup all variant entries at once
    const entriesMap = await this.findEntriesByField(
      CONTENT_TYPE_ID.product_variant,
      "slug",
      variantSlugs,
    );

    const entryIds: string[] = [];
    for (const [slug, entry] of entriesMap) {
      if (entry?.sys?.id) {
        entryIds.push(entry.sys.id);
      }
    }

    return entryIds;
  }

  /**
   * Finds the parent product entry for a given variant
   * @param variant The ProductVariant entity
   * @param defaultLanguageCode The default language code to use for slug lookup
   * @returns Contentful entry ID of the parent product or null
   */
  private async findParentProductEntryId(
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
        const entry = await this.findEntryByField(
          CONTENT_TYPE_ID.product,
          "slug",
          slug,
        );
        return entry?.sys?.id || null;
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

  private async createEntryFromProduct(
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
        `Cannot create entry: no valid translation data for product ${product.id}`,
      );
      return;
    }

    const result = await this.makeContentfulRequest({
      method: "POST",
      endpoint: this.entriesPath,
      data,
      headers: {
        "X-Contentful-Content-Type": CONTENT_TYPE_ID.product,
      },
    });

    // Publish the entry
    if (result.sys?.id) {
      await this.publishEntry(result.sys.id, result.sys.version);
    }

    Logger.info(
      `Created entry for product ${product.id} with Contentful ID: ${result.sys?.id}`,
    );
  }

  private async updateEntryFromProduct(
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

    const existingEntry = await this.findEntryByField(
      CONTENT_TYPE_ID.product,
      "slug",
      slug,
    );

    if (!existingEntry) {
      Logger.warn(
        `Entry not found in Contentful for slug: ${slug}. Creating new entry instead.`,
      );
      await this.createEntryFromProduct(product, defaultLanguageCode);
      return;
    }

    const data = await this.transformProductData(
      product,
      defaultLanguageCode,
      productSlug,
    );
    if (!data) {
      Logger.error(
        `Cannot update entry: no valid translation data for product ${product.id}`,
      );
      return;
    }

    const result = await this.makeContentfulRequest({
      method: "PUT",
      endpoint: `${this.entriesPath}/${existingEntry.sys.id}`,
      data,
      headers: {
        "X-Contentful-Version": existingEntry.sys.version.toString(),
      },
    });

    // Publish the updated entry
    if (result.sys?.id) {
      await this.publishEntry(result.sys.id, result.sys.version);
    }

    Logger.info(
      `Updated entry for product ${product.id} (Contentful ID: ${existingEntry.sys.id})`,
    );
  }

  private async deleteEntryFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.warn(
        `No slug found for product ${product.id}, cannot delete entry`,
      );
      return;
    }

    const existingEntry = await this.findEntryByField(
      CONTENT_TYPE_ID.product,
      "slug",
      slug,
    );

    if (!existingEntry) {
      Logger.warn(
        `Entry not found in Contentful for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    // Unpublish first if published
    if (existingEntry.sys.publishedVersion) {
      await this.unpublishEntry(existingEntry.sys.id);
    }

    await this.makeContentfulRequest({
      method: "DELETE",
      endpoint: `${this.entriesPath}/${existingEntry.sys.id}`,
    });

    Logger.info(
      `Deleted entry for product ${product.id} (Contentful ID: ${existingEntry.sys.id})`,
    );
  }

  // Variant-specific CRUD methods
  private async createEntryFromVariant(
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
        `Cannot create entry: no valid translation data for variant ${variant.id}`,
      );
      return;
    }

    const result = await this.makeContentfulRequest({
      method: "POST",
      endpoint: this.entriesPath,
      data,
      headers: {
        "X-Contentful-Content-Type": CONTENT_TYPE_ID.product_variant,
      },
    });

    // Publish the entry
    if (result.sys?.id) {
      await this.publishEntry(result.sys.id, result.sys.version);
    }

    Logger.info(
      `Created entry for variant ${variant.id} with Contentful ID: ${result.sys?.id}`,
    );
  }

  private async updateEntryFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ): Promise<void> {
    const existingEntry = await this.findEntryByField(
      CONTENT_TYPE_ID.product_variant,
      "slug",
      variantSlug,
    );

    if (!existingEntry) {
      Logger.warn(
        `Entry not found in Contentful for slug: ${variantSlug}. Creating new entry instead.`,
      );
      await this.createEntryFromVariant(
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
        `Cannot update entry: no valid translation data for variant ${variant.id}`,
      );
      return;
    }

    const result = await this.makeContentfulRequest({
      method: "PUT",
      endpoint: `${this.entriesPath}/${existingEntry.sys.id}`,
      data,
      headers: {
        "X-Contentful-Version": existingEntry.sys.version.toString(),
      },
    });

    // Publish the updated entry
    if (result.sys?.id) {
      await this.publishEntry(result.sys.id, result.sys.version);
    }

    Logger.info(
      `Updated entry for variant ${variant.id} (Contentful ID: ${existingEntry.sys.id})`,
    );
  }

  private async deleteEntryFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
  ): Promise<void> {
    const existingEntry = await this.findEntryByField(
      CONTENT_TYPE_ID.product_variant,
      "slug",
      variantSlug,
    );

    if (!existingEntry) {
      Logger.warn(
        `Entry not found in Contentful for slug: ${variantSlug}, nothing to delete`,
      );
      return;
    }

    // Unpublish first if published
    if (existingEntry.sys.publishedVersion) {
      await this.unpublishEntry(existingEntry.sys.id);
    }

    await this.makeContentfulRequest({
      method: "DELETE",
      endpoint: `${this.entriesPath}/${existingEntry.sys.id}`,
    });

    Logger.info(
      `Deleted entry for variant ${variant.id} (Contentful ID: ${existingEntry.sys.id})`,
    );
  }

  // Collection-specific CRUD methods
  private async createEntryFromCollection(
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
        `Cannot create entry: no valid translation data for collection ${collection.id}`,
      );
      return;
    }

    const result = await this.makeContentfulRequest({
      method: "POST",
      endpoint: this.entriesPath,
      data,
      headers: {
        "X-Contentful-Content-Type": CONTENT_TYPE_ID.collection,
      },
    });

    // Publish the entry
    if (result.sys?.id) {
      await this.publishEntry(result.sys.id, result.sys.version);
    }

    Logger.info(
      `Created entry for collection ${collection.id} with Contentful ID: ${result.sys?.id}`,
    );
  }

  private async updateEntryFromCollection(
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

    const existingEntry = await this.findEntryByField(
      CONTENT_TYPE_ID.collection,
      "slug",
      slug,
    );

    if (!existingEntry) {
      Logger.warn(
        `Entry not found in Contentful for slug: ${slug}. Creating new entry instead.`,
      );
      await this.createEntryFromCollection(
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
        `Cannot update entry: no valid translation data for collection ${collection.id}`,
      );
      return;
    }

    const result = await this.makeContentfulRequest({
      method: "PUT",
      endpoint: `${this.entriesPath}/${existingEntry.sys.id}`,
      data,
      headers: {
        "X-Contentful-Version": existingEntry.sys.version.toString(),
      },
    });

    // Publish the updated entry
    if (result.sys?.id) {
      await this.publishEntry(result.sys.id, result.sys.version);
    }

    Logger.info(
      `Updated entry for collection ${collection.id} (Contentful ID: ${existingEntry.sys.id})`,
    );
  }

  private async deleteEntryFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      collection.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.warn(
        `No slug found for collection ${collection.id}, cannot delete entry`,
      );
      return;
    }

    const existingEntry = await this.findEntryByField(
      CONTENT_TYPE_ID.collection,
      "slug",
      slug,
    );

    if (!existingEntry) {
      Logger.warn(
        `Entry not found in Contentful for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    // Unpublish first if published
    if (existingEntry.sys.publishedVersion) {
      await this.unpublishEntry(existingEntry.sys.id);
    }

    await this.makeContentfulRequest({
      method: "DELETE",
      endpoint: `${this.entriesPath}/${existingEntry.sys.id}`,
    });

    Logger.info(
      `Deleted entry for collection ${collection.id} (Contentful ID: ${existingEntry.sys.id})`,
    );
  }

  private async publishEntry(entryId: string, version: number): Promise<void> {
    try {
      await this.makeContentfulRequest({
        method: "PUT",
        endpoint: `${this.entriesPath}/${entryId}/published`,
        headers: {
          "X-Contentful-Version": version.toString(),
        },
      });
    } catch (error) {
      Logger.error(`Failed to publish entry ${entryId}`, String(error));
    }
  }

  private async unpublishEntry(entryId: string): Promise<void> {
    try {
      await this.makeContentfulRequest({
        method: "DELETE",
        endpoint: `${this.entriesPath}/${entryId}/published`,
      });
    } catch (error) {
      Logger.error(`Failed to unpublish entry ${entryId}`, String(error));
    }
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

    // Map to Contentful locale format
    const contentfulLocale = this.mapToContentfulLocale(defaultLanguageCode);

    // Find parent product entry for this variant
    const parentProductEntryId = await this.findParentProductEntryId(
      variant,
      defaultLanguageCode,
    );

    // Transform collections to entry references
    const collectionEntryRefs: any[] = [];
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

      // Batch lookup all collection entries at once
      if (collectionSlugs.length > 0) {
        const entriesMap = await this.findEntriesByField(
          CONTENT_TYPE_ID.collection,
          "slug",
          collectionSlugs,
        );

        // Extract entry references from found entries
        for (const [slug, entry] of entriesMap) {
          if (entry?.sys?.id) {
            collectionEntryRefs.push({
              sys: {
                type: "Link",
                linkType: "Entry",
                id: entry.sys.id,
              },
            });
          }
        }
      }
    }

    const result = {
      fields: {
        name: {
          [contentfulLocale]: defaultTranslation?.name,
        },
        slug: {
          [contentfulLocale]: variantSlug,
        },
        vendureId: {
          [contentfulLocale]: variant.id.toString(),
        },
        ...(parentProductEntryId && {
          parentProduct: {
            [contentfulLocale]: {
              sys: {
                type: "Link",
                linkType: "Entry",
                id: parentProductEntryId,
              },
            },
          },
        }),
        ...(collectionEntryRefs.length > 0 && {
          collections: {
            [contentfulLocale]: collectionEntryRefs,
          },
        }),
      },
    };

    return result;
  }

  private contentfulLocales: string[] = [];
  private defaultContentfulLocale: string = "en-US";

  /**
   * Fetches available locales from Contentful space
   */
  private async fetchContentfulLocales(): Promise<void> {
    try {
      const response = await this.makeContentfulRequest({
        method: "GET",
        endpoint: "locales",
        skipInitializationCheck: true,
      });

      if (response.items) {
        this.contentfulLocales = response.items.map(
          (locale: any) => locale.code,
        );

        // Find the default locale
        const defaultLocale = response.items.find(
          (locale: any) => locale.default,
        );
        if (defaultLocale) {
          this.defaultContentfulLocale = defaultLocale.code;
        }

        Logger.info(
          `Fetched Contentful locales: ${this.contentfulLocales.join(", ")}`,
        );
        Logger.info(
          `Default Contentful locale: ${this.defaultContentfulLocale}`,
        );
      }
    } catch (error) {
      Logger.warn(
        `Failed to fetch Contentful locales, using fallback mapping: ${error}`,
      );
    }
  }

  /**
   * Maps Vendure language codes to Contentful locale codes
   */
  private mapToContentfulLocale(vendureLanguageCode: LanguageCode): string {
    // If we haven't fetched locales yet, use static mapping
    if (this.contentfulLocales.length === 0) {
      const localeMap: Record<string, string> = {
        en: "en-US",
        de: "de-DE",
        es: "es-ES",
        fr: "fr-FR",
        it: "it-IT",
        nl: "nl-NL",
        pt: "pt-BR",
        ja: "ja-JP",
        zh: "zh-CN",
      };

      return localeMap[vendureLanguageCode] || this.defaultContentfulLocale;
    }

    // Try to find a matching locale in the fetched locales
    const matchingLocale = this.contentfulLocales.find((locale) =>
      locale.toLowerCase().startsWith(vendureLanguageCode.toLowerCase()),
    );

    return matchingLocale || this.defaultContentfulLocale;
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


    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );

    // Map to Contentful locale format
    const contentfulLocale = this.mapToContentfulLocale(defaultLanguageCode);

    // For now, only sync basic product fields without variants
    const result = {
      fields: {
        name: {
          [contentfulLocale]: defaultTranslation?.name,
        },
        slug: {
          [contentfulLocale]: slug,
        },
        vendureId: {
          [contentfulLocale]: product.id.toString(),
        },
      },
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

    // Transform variants to entry references
    const variantEntryRefs: any[] = [];
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

      // Batch lookup all variant entries at once
      if (variantSlugs.length > 0) {
        const entriesMap = await this.findEntriesByField(
          CONTENT_TYPE_ID.product_variant,
          "slug",
          variantSlugs,
        );

        // Extract entry references from found entries
        for (const [slug, entry] of entriesMap) {
          if (entry?.sys?.id) {
            variantEntryRefs.push({
              sys: {
                type: "Link",
                linkType: "Entry",
                id: entry.sys.id,
              },
            });
          }
        }
      }
    }

    // Map to Contentful locale format
    const contentfulLocale = this.mapToContentfulLocale(defaultLanguageCode);

    const result = {
      fields: {
        name: {
          [contentfulLocale]: defaultTranslation?.name,
        },
        slug: {
          [contentfulLocale]: slug,
        },
        vendureId: {
          [contentfulLocale]: collection.id.toString(),
        },
        ...(variantEntryRefs.length > 0 && {
          variants: {
            [contentfulLocale]: variantEntryRefs,
          },
        }),
      },
    };

    return result;
  }

  private async checkContentTypes() {
    const response = await this.makeContentfulRequest({
      method: "GET",
      endpoint: this.contentTypesPath,
      skipInitializationCheck: true,
    });

    const checkIfExists = (contentTypeId: string) => {
      return (
        response.items.findIndex((ct: any) => ct.sys.id === contentTypeId) !==
        -1
      );
    };

    return {
      product: checkIfExists(CONTENT_TYPE_ID.product),
      variant: checkIfExists(CONTENT_TYPE_ID.product_variant),
      collection: checkIfExists(CONTENT_TYPE_ID.collection),
    };
  }

  async ensureContentfulContentTypesExists() {
    // First, fetch available locales from Contentful
    await this.fetchContentfulLocales();

    const contentCheck = await this.checkContentTypes();

    const shapeContentTypeData = (
      contentType: keyof typeof CONTENT_TYPE_ID,
    ) => {
      const displayNames = {
        product: "Vendure Product",
        product_variant: "Vendure Product Variant",
        collection: "Vendure Collection",
      };

      // Base fields for all content types
      const baseFields = [
        {
          id: "name",
          name: "Name",
          type: "Symbol",
          required: true,
        },
        {
          id: "slug",
          name: "Slug",
          type: "Symbol",
          required: true,
        },
        {
          id: "vendureId",
          name: "Vendure ID",
          type: "Symbol",
          required: true,
        },
      ];

      // Add relationship fields based on content type
      let relationshipFields: any[] = [];
      if (contentType === "product") {
        relationshipFields = [
          {
            id: "variants",
            name: "Product Variants",
            type: "Array",
            items: {
              type: "Link",
              linkType: "Entry",
              validations: [
                {
                  linkContentType: [CONTENT_TYPE_ID.product_variant],
                },
              ],
            },
          },
        ];
      } else if (contentType === "product_variant") {
        relationshipFields = [
          {
            id: "parentProduct",
            name: "Parent Product",
            type: "Link",
            linkType: "Entry",
            validations: [
              {
                linkContentType: [CONTENT_TYPE_ID.product],
              },
            ],
          },
          {
            id: "collections",
            name: "Collections",
            type: "Array",
            items: {
              type: "Link",
              linkType: "Entry",
              validations: [
                {
                  linkContentType: [CONTENT_TYPE_ID.collection],
                },
              ],
            },
          },
        ];
      } else if (contentType === "collection") {
        relationshipFields = [
          {
            id: "variants",
            name: "Product Variants",
            type: "Array",
            items: {
              type: "Link",
              linkType: "Entry",
              validations: [
                {
                  linkContentType: [CONTENT_TYPE_ID.product_variant],
                },
              ],
            },
          },
        ];
      }

      return {
        name: displayNames[contentType],
        fields: [...baseFields, ...relationshipFields],
      };
    };

    const createOrUpdateContentType = async (
      contentType: keyof typeof CONTENT_TYPE_ID,
    ) => {
      const data = shapeContentTypeData(contentType);
      const contentTypeId = CONTENT_TYPE_ID[contentType];

      try {
        // First, try to get the existing content type
        const existingContentType = await this.makeContentfulRequest({
          method: "GET",
          endpoint: `${this.contentTypesPath}/${contentTypeId}`,
          skipInitializationCheck: true,
        });

        Logger.info(`Updating existing content type ${contentTypeId}`);
        const response = await this.makeContentfulRequest({
          method: "PUT",
          endpoint: `${this.contentTypesPath}/${contentTypeId}`,
          data: data,
          headers: {
            "X-Contentful-Version": existingContentType.sys.version.toString(),
          },
          skipInitializationCheck: true,
        });

        return response;
      } catch (error) {
        // If content type doesn't exist (404), create it
        Logger.info(`Creating new content type ${contentTypeId}`);
        const response = await this.makeContentfulRequest({
          method: "PUT",
          endpoint: `${this.contentTypesPath}/${contentTypeId}`,
          data: data,
          skipInitializationCheck: true,
        });

        return response;
      }
    };

    const handleContentTypeResponse = async (response: any) => {
      if (response.sys?.id) {
        Logger.info(
          `Created ${response.name} content type with ID ${response.sys.id}`,
        );

        // Fetch the latest version before publishing to avoid version mismatch
        const latestContentType = await this.makeContentfulRequest({
          method: "GET",
          endpoint: `${this.contentTypesPath}/${response.sys.id}`,
          skipInitializationCheck: true,
        });

        // Activate the content type with the latest version
        await this.makeContentfulRequest({
          method: "PUT",
          endpoint: `${this.contentTypesPath}/${response.sys.id}/published`,
          headers: {
            "X-Contentful-Version": latestContentType.sys.version.toString(),
          },
          skipInitializationCheck: true,
        });

        Logger.info(`Activated content type ${response.sys.id}`);
      }
    };

    if (!contentCheck.product) {
      const response = await createOrUpdateContentType("product");
      await handleContentTypeResponse(response);
    }

    if (!contentCheck.variant) {
      const response = await createOrUpdateContentType("product_variant");
      await handleContentTypeResponse(response);
    }

    if (!contentCheck.collection) {
      const response = await createOrUpdateContentType("collection");
      await handleContentTypeResponse(response);
    }

    this.isInitialized = true;
  }

  private getContentfulHeaders(): Record<string, string> {
    if (!this.options.cmsApiKey) {
      Logger.error("Contentful API key is not configured");
    }

    return {
      Authorization: `Bearer ${this.options.cmsApiKey}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
    };
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

  private async makeContentfulRequest({
    method,
    endpoint,
    data,
    headers = {},
    skipInitializationCheck = false,
  }: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
    data?: any;
    headers?: Record<string, string>;
    skipInitializationCheck?: boolean;
  }): Promise<any> {
    const url = `${this.contentfulBaseUrl}/spaces/${this.options.contentfulSpaceId}/environments/master/${endpoint}`;
    const config: RequestInit = {
      method,
      headers: {
        ...this.getContentfulHeaders(),
        ...headers,
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(data);
    }

    // Wait for content types initialization if needed
    if (!skipInitializationCheck) {
      let attempts = 0;
      const maxAttempts = 100;
      while (!this.isInitialized && attempts < maxAttempts) {
        await new Promise((res) =>
          setTimeout(
            res,
            Math.min(10 + 1.03 ** (attempts + 1) * attempts * 0.5, 30000),
          ),
        );
        attempts++;
        if (attempts === maxAttempts - 1) {
          Logger.error(
            "Reached max attempts while waiting for Contentful content types initialization",
          );
        }
      }
    }

    // Enforce rate limiting before making the request
    await this.enforceRateLimit();

    Logger.debug(`Making Contentful API request: ${method} ${url}`);


    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Contentful API error: ${response.status} ${response.statusText} - ${errorText}`;
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (method === "DELETE") {
      return {}; // DELETE requests typically don't return content
    }

    return await response.json();
  }
}
