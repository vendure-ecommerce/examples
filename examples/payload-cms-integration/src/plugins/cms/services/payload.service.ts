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
const COMPONENT_TYPE = {
  product: "vendure_product",
  product_variant: "vendure_product_variant",
  collection: "vendure_collection",
};

@Injectable()
export class PayloadService {
  private readonly storyblokBaseUrl = "https://mapi.storyblok.com/v1";
  private readonly componentsPath = "components";
  private isInitialized = false;
  private readonly translationUtils = new TranslationUtils();
  private lastApiCallTime = 0;
  private readonly rateLimitDelay = 200; // 200ms between calls = max 5 calls/second

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
        `Syncing product ${product.id} (${operationType}) to Storyblok`,
      );

      switch (operationType) {
        case "create":
          await this.createStoryFromProduct(
            product,
            defaultLanguageCode,
            productSlug,
          );
          break;
        case "update":
          await this.updateStoryFromProduct(
            product,
            defaultLanguageCode,
            productSlug,
          );
          break;
        case "delete":
          await this.deleteStoryFromProduct(product, defaultLanguageCode);
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced product ${product.id} (${operationType}) to Storyblok`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product ${product.id} (${operationType}) to Storyblok: ${errorMessage}`,
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
        `Syncing product variant ${variant.id} (${operationType}) to Storyblok`,
      );

      switch (operationType) {
        case "create":
          await this.createStoryFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
            collections,
          );
          break;
        case "update":
          await this.updateStoryFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
            collections,
          );
          break;
        case "delete":
          await this.deleteStoryFromVariant(
            variant,
            defaultLanguageCode,
            variantSlug,
          );
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced product variant ${variant.id} (${operationType}) to Storyblok`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync product variant ${variant.id} (${operationType}) to Storyblok: ${errorMessage}`,
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
        `Syncing collection ${collection.id} (${operationType}) to Storyblok`,
      );

      switch (operationType) {
        case "create":
          await this.createStoryFromCollection(
            collection,
            defaultLanguageCode,
            collectionSlug,
            variants,
          );
          break;
        case "update":
          await this.updateStoryFromCollection(
            collection,
            defaultLanguageCode,
            collectionSlug,
            variants,
          );
          break;
        case "delete":
          await this.deleteStoryFromCollection(collection, defaultLanguageCode);
          break;
        default:
          Logger.error(`Unknown operation type: ${operationType}`);
      }

      Logger.info(
        `Successfully synced collection ${collection.id} (${operationType}) to Storyblok`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Failed to sync collection ${collection.id} (${operationType}) to Storyblok: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Finds a Storyblok story by slug
   * @param slug The slug to search for
   * @returns The story object or null if not found
   */
  private async findStoryBySlug(slug: string): Promise<any> {
    try {
      const response = await this.makeStoryblokRequest({
        method: "GET",
        endpoint: `stories?by_slugs=${slug}`,
      });

      return response.stories.find((story: any) => story.slug === slug);
    } catch (error) {
      Logger.error(`Failed to find story by slug: ${slug}`, String(error));
    }
  }

  /**
   * Finds multiple Storyblok stories by slugs in a single API call
   * @param slugs Array of slugs to search for
   * @returns Map of slug to story object
   */
  private async findStoriesBySlugs(slugs: string[]): Promise<Map<string, any>> {
    const storyMap = new Map<string, any>();

    if (slugs.length === 0) {
      return storyMap;
    }

    try {
      // Storyblok supports comma-separated slugs in the by_slugs parameter
      const slugsParam = slugs.join(",");
      const response = await this.makeStoryblokRequest({
        method: "GET",
        endpoint: `stories?by_slugs=${slugsParam}`,
      });

      if (response.stories) {
        for (const story of response.stories) {
          storyMap.set(story.slug, story);
        }
      }
    } catch (error) {
      Logger.error(
        `Failed to find stories by slugs: ${slugs.join(", ")}`,
        String(error),
      );
    }

    return storyMap;
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
   * Finds all Storyblok stories that represent variants of a product
   * @param productId The Vendure product ID
   * @param defaultLanguageCode The default language code to use for slug lookup
   * @returns Array of Storyblok story IDs
   */
  private async findVariantStoriesForProductUuids(
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

    // Batch lookup all variant stories at once
    const storiesMap = await this.findStoriesBySlugs(variantSlugs);

    const storyIds: string[] = [];
    for (const [slug, story] of storiesMap) {
      if (story?.uuid) {
        storyIds.push(story.uuid.toString());
      }
    }

    return storyIds;
  }

  /**
   * Finds the parent product story for a given variant
   * @param variant The ProductVariant entity
   * @param defaultLanguageCode The default language code to use for slug lookup
   * @returns Storyblok story ID of the parent product or null
   */
  private async findParentProductStoryUuid(
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
        const story = await this.findStoryBySlug(slug);
        return story?.uuid?.toString() || null;
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

  private async createStoryFromProduct(
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
        `Cannot create story: no valid translation data for product ${product.id}`,
      );
      return;
    }

    const result = await this.makeStoryblokRequest({
      method: "POST",
      endpoint: "stories",
      data,
    });

    Logger.info(
      `Created story for product ${product.id} with Storyblok ID: ${result.story?.id}`,
    );
  }

  private async updateStoryFromProduct(
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

    const existingStory = await this.findStoryBySlug(slug);

    if (!existingStory) {
      Logger.warn(
        `Story not found in Storyblok for slug: ${slug}. Creating new story instead.`,
      );
      await this.createStoryFromProduct(product, defaultLanguageCode);
      return;
    }

    const data = await this.transformProductData(
      product,
      defaultLanguageCode,
      productSlug,
    );
    if (!data) {
      Logger.error(
        `Cannot update story: no valid translation data for product ${product.id}`,
      );
      return;
    }

    await this.makeStoryblokRequest({
      method: "PUT",
      endpoint: `stories/${existingStory.id}`,
      data,
    });

    Logger.info(
      `Updated story for product ${product.id} (Storyblok ID: ${existingStory.id})`,
    );
  }

  private async deleteStoryFromProduct(
    product: Product,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.warn(
        `No slug found for product ${product.id}, cannot delete story`,
      );
      return;
    }

    const existingStory = await this.findStoryBySlug(slug);

    if (!existingStory) {
      Logger.warn(
        `Story not found in Storyblok for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    await this.makeStoryblokRequest({
      method: "DELETE",
      endpoint: `stories/${existingStory.id}`,
    });

    Logger.info(
      `Deleted story for product ${product.id} (Storyblok ID: ${existingStory.id})`,
    );
  }

  // Variant-specific CRUD methods
  private async createStoryFromVariant(
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
        `Cannot create story: no valid translation data for variant ${variant.id}`,
      );
      return;
    }

    const result = await this.makeStoryblokRequest({
      method: "POST",
      endpoint: "stories",
      data,
    });

    Logger.info(
      `Created story for variant ${variant.id} with Storyblok ID: ${result.story?.id}`,
    );
  }

  private async updateStoryFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
    collections?: Collection[],
  ): Promise<void> {
    const existingStory = await this.findStoryBySlug(variantSlug);

    if (!existingStory) {
      Logger.warn(
        `Story not found in Storyblok for slug: ${variantSlug}. Creating new story instead.`,
      );
      await this.createStoryFromVariant(
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
        `Cannot update story: no valid translation data for variant ${variant.id}`,
      );
      return;
    }

    await this.makeStoryblokRequest({
      method: "PUT",
      endpoint: `stories/${existingStory.id}`,
      data,
    });

    Logger.info(
      `Updated story for variant ${variant.id} (Storyblok ID: ${existingStory.id})`,
    );
  }

  private async deleteStoryFromVariant(
    variant: ProductVariant,
    defaultLanguageCode: LanguageCode,
    variantSlug: string,
  ): Promise<void> {
    const existingStory = await this.findStoryBySlug(variantSlug);

    if (!existingStory) {
      Logger.warn(
        `Story not found in Storyblok for slug: ${variantSlug}, nothing to delete`,
      );
      return;
    }

    await this.makeStoryblokRequest({
      method: "DELETE",
      endpoint: `stories/${existingStory.id}`,
    });

    Logger.info(
      `Deleted story for variant ${variant.id} (Storyblok ID: ${existingStory.id})`,
    );
  }

  // Collection-specific CRUD methods
  private async createStoryFromCollection(
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
        `Cannot create story: no valid translation data for collection ${collection.id}`,
      );
      return;
    }

    const result = await this.makeStoryblokRequest({
      method: "POST",
      endpoint: "stories",
      data,
    });

    Logger.info(
      `Created story for collection ${collection.id} with Storyblok ID: ${result.story?.id}`,
    );
  }

  private async updateStoryFromCollection(
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

    const existingStory = await this.findStoryBySlug(slug);

    if (!existingStory) {
      Logger.warn(
        `Story not found in Storyblok for slug: ${slug}. Creating new story instead.`,
      );
      await this.createStoryFromCollection(
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
        `Cannot update story: no valid translation data for collection ${collection.id}`,
      );
      return;
    }

    await this.makeStoryblokRequest({
      method: "PUT",
      endpoint: `stories/${existingStory.id}`,
      data,
    });

    Logger.info(
      `Updated story for collection ${collection.id} (Storyblok ID: ${existingStory.id})`,
    );
  }

  private async deleteStoryFromCollection(
    collection: Collection,
    defaultLanguageCode: LanguageCode,
  ): Promise<void> {
    const slug = this.translationUtils.getSlugByLanguage(
      collection.translations,
      defaultLanguageCode,
    );
    if (!slug) {
      Logger.warn(
        `No slug found for collection ${collection.id}, cannot delete story`,
      );
      return;
    }

    const existingStory = await this.findStoryBySlug(slug);

    if (!existingStory) {
      Logger.warn(
        `Story not found in Storyblok for slug: ${slug}, nothing to delete`,
      );
      return;
    }

    await this.makeStoryblokRequest({
      method: "DELETE",
      endpoint: `stories/${existingStory.id}`,
    });

    Logger.info(
      `Deleted story for collection ${collection.id} (Storyblok ID: ${existingStory.id})`,
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

    // Find parent product story for this variant
    const parentProductStoryUuid = await this.findParentProductStoryUuid(
      variant,
      defaultLanguageCode,
    );

    // Transform collections to story UUIDs
    const collectionStoryUuids: string[] = [];
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

      // Batch lookup all collection stories at once
      if (collectionSlugs.length > 0) {
        const storiesMap = await this.findStoriesBySlugs(collectionSlugs);

        // Extract UUIDs from found stories
        for (const [slug, story] of storiesMap) {
          if (story?.uuid) {
            collectionStoryUuids.push(story.uuid.toString());
          }
        }
      }
    }

    const result = {
      story: {
        name: defaultTranslation?.name,
        slug: variantSlug,
        content: {
          component: COMPONENT_TYPE.product_variant,
          vendureId: variant.id.toString(),
          parentProduct: parentProductStoryUuid ? [parentProductStoryUuid] : [],
          collections: collectionStoryUuids,
        },
      } as any,
      publish: 1,
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

    // Find all variant stories for this product
    const variantStoryIds = await this.findVariantStoriesForProductUuids(
      product.id,
      defaultLanguageCode,
      productSlug,
    );

    const slug = this.translationUtils.getSlugByLanguage(
      product.translations,
      defaultLanguageCode,
    );

    const result = {
      story: {
        name: defaultTranslation?.name,
        slug: slug,
        content: {
          component: COMPONENT_TYPE.product,
          vendureId: product.id.toString(),
          variants: variantStoryIds,
        },
      } as any,
      publish: 1,
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

    // Transform variants to story UUIDs
    const variantStoryUuids: string[] = [];
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

      // Batch lookup all variant stories at once
      if (variantSlugs.length > 0) {
        const storiesMap = await this.findStoriesBySlugs(variantSlugs);

        // Extract UUIDs from found stories
        for (const [slug, story] of storiesMap) {
          if (story?.uuid) {
            variantStoryUuids.push(story.uuid.toString());
          }
        }
      }
    }

    const result = {
      story: {
        name: defaultTranslation?.name,
        slug: slug,
        content: {
          component: COMPONENT_TYPE.collection,
          vendureId: collection.id.toString(),
          variants: variantStoryUuids,
        },
      } as any,
      publish: 1,
    };

    return result;
  }

  private async checkContentTypes() {
    //  curl -H "Authorization: QtQtXHU2tFjkk7P1peAblAtt-70271483895739-r3UgJzCHEfz3C9hxJVWD" 'https://mapi.storyblok.com/v1/spaces/286724947198305/components?search=Vendure' | jq
    const response = await this.makeStoryblokRequest({
      method: "GET",
      endpoint: `${this.componentsPath}?search=vendure`,
      skipInitializationCheck: true,
    });

    const checkIfExists = (name: string) => {
      return response.components.findIndex((c: any) => c.name === name) !== -1;
    };

    return {
      product: checkIfExists(COMPONENT_TYPE.product),
      variant: checkIfExists(COMPONENT_TYPE.product_variant),
      collection: checkIfExists(COMPONENT_TYPE.collection),
    };
  }

  private getStoryblokHeaders(): Record<string, string> {
    if (!this.options.cmsApiKey) {
      Logger.error("Storyblok API key is not configured");
    }

    return {
      Authorization: this.options.cmsApiKey as string,
      "Content-Type": "application/json",
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
  private async makeStoryblokRequest({
    method,
    endpoint,
    data,
    skipInitializationCheck = false,
  }: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
    data?: any;
    skipInitializationCheck?: boolean;
  }): Promise<any> {
    const url = `${this.storyblokBaseUrl}/spaces/${this.options.storyblokSpaceId}/${endpoint}`;
    const config: RequestInit = {
      method,
      headers: this.getStoryblokHeaders(),
    };

    if (data && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(data);
    }

    // In the case the content types have not yet been initialized this code will wait until it is
    // and includes an exponential back off strategy
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
            "Reached max attempts while waiting for Storyblok content types initialization",
          );
        }
      }
    }

    // Enforce rate limiting before making the request
    await this.enforceRateLimit();

    Logger.debug(`Making Storyblok API request: ${method} ${url}`);
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Storyblok API error: ${response.status} ${response.statusText} - ${errorText}`;
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (method === "DELETE") {
      return {}; // DELETE requests typically don't return content
    }

    return await response.json();
  }
}
