// TODO: Remove onApplicationBootstrap

import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import {
  ChannelService,
  Collection,
  CollectionService,
  ID,
  LanguageCode,
  Logger,
  ProcessContext,
  Product,
  ProductVariant,
  RequestContext,
  RequestContextService,
  TransactionalConnection,
} from "@vendure/core";
import { In } from "typeorm";
import { CMS_PLUGIN_OPTIONS, loggerCtx } from "../constants";
import { PluginInitOptions, SyncJobData, SyncResponse } from "../types";
import { TranslationUtils } from "../utils/translation.utils";
import { SanityService } from "./sanity.service";

@Injectable()
export class CmsSyncService implements OnApplicationBootstrap {
  private readonly translationUtils = new TranslationUtils();

  // Entity type constants - following the pattern from StoryblokService
  private readonly ENTITY_TYPES = {
    product: "Product",
    product_variant: "ProductVariant",
    collection: "Collection",
  } as const;

  constructor(
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
    private readonly connection: TransactionalConnection,
    private readonly channelService: ChannelService,
    private readonly collectionService: CollectionService,
    private readonly requestContextService: RequestContextService,
    private readonly sanityService: SanityService,
    private processContext: ProcessContext,
  ) {}

  async onApplicationBootstrap() {
    if (this.processContext.isWorker) {
      // Enable parallel bulk sync on startup
      // this.syncAllEntityTypes();
      Logger.info("CMS Sync Service initialized");
      // this.ensureContentTypesExists();
    }
  }

  ensureContentTypesExists() {
    // Content types are defined in the Sanity schema - no need to create them programmatically
  }

  private async getDefaultLanguageCode(): Promise<LanguageCode> {
    const defaultChannel = await this.channelService.getDefaultChannel();
    return defaultChannel.defaultLanguageCode;
  }

  /**
   * Finds all collections that contain a given variant.
   * Searches through all collections to find which ones include the specified variant.
   * @param ctx - The request context for authorization
   * @param variantId - The ProductVariant ID to search for
   * @returns Promise<Collection[]> - Array of Collection entities containing the variant
   */
  async findCollectionsForVariant(
    ctx: RequestContext,
    variantId: string | number,
  ): Promise<Collection[]> {
    try {
      const collections = await this.collectionService.findAll(ctx);
      const collectionsWithVariant: Collection[] = [];

      for (const collection of collections.items) {
        const variantIds =
          await this.collectionService.getCollectionProductVariantIds(
            collection,
            ctx,
          );

        const hasVariant = variantIds.some(
          (id) => id.toString() === variantId.toString(),
        );

        if (hasVariant) {
          collectionsWithVariant.push(collection);
        }
      }

      return collectionsWithVariant;
    } catch (error) {
      Logger.error(
        `Failed to find collections for variant ${variantId}`,
        String(error),
      );
      return [];
    }
  }

  /**
   * Finds all variants that belong to a given collection.
   * Retrieves all ProductVariant entities associated with the specified collection.
   * @param ctx - The request context for authorization
   * @param collectionId - The Collection ID to find variants for
   * @returns Promise<ProductVariant[]> - Array of ProductVariant entities in the collection
   */
  async findVariantsForCollection(
    ctx: RequestContext,
    collectionId: string | number,
  ): Promise<ProductVariant[]> {
    try {
      // Fetch the collection entity first
      const collection = await this.connection.rawConnection
        .getRepository(Collection)
        .findOne({
          where: { id: collectionId as any },
        });

      if (!collection) {
        return [];
      }

      const variantIds =
        await this.collectionService.getCollectionProductVariantIds(
          collection,
          ctx,
        );

      // Fetch actual ProductVariant entities
      if (variantIds.length === 0) {
        return [];
      }

      const variants = await this.connection.rawConnection
        .getRepository(ProductVariant)
        .find({
          where: { id: In(variantIds) },
          relations: ["translations", "product", "product.translations"],
          order: { id: "ASC" },
        });

      return variants;
    } catch (error) {
      Logger.error(
        `Failed to find variants for collection ${collectionId}`,
        String(error),
      );
      return [];
    }
  }

  private async syncAllEntitiesToCmsGeneric<T extends { id: any }>(
    entityType: "Product" | "ProductVariant" | "Collection",
    repository: any,
    syncMethod: (jobData: SyncJobData) => Promise<SyncResponse>,
  ): Promise<{
    success: boolean;
    totalEntities: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
      entityId: number | string;
      error: string;
      attempts: number;
    }>;
  }> {
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    const finalErrors: Array<{
      entityId: number | string;
      error: string;
      attempts: number;
    }> = [];

    try {
      Logger.info(
        `[${loggerCtx}] Starting sync of all ${entityType.toLowerCase()}s to CMS with rate limiting`,
      );

      // Fetch all entities with translations
      const entities = await this.connection.rawConnection
        .getRepository(repository)
        .find({
          relations: ["translations"],
          order: { id: "ASC" },
        });

      const totalEntities = entities.length;
      Logger.info(
        `[${loggerCtx}] Found ${totalEntities} ${entityType.toLowerCase()}s to sync`,
      );

      if (totalEntities === 0) {
        return {
          success: true,
          totalEntities: 0,
          successCount: 0,
          errorCount: 0,
          errors: [],
        };
      }

      // Create a job queue with retry logic
      interface EntityJob {
        entity: T;
        attempts: number;
        maxAttempts: number;
        lastError?: string;
      }

      // Initialize job queue
      const jobQueue: EntityJob[] = entities.map((entity) => ({
        entity: entity as T,
        attempts: 0,
        maxAttempts: 10,
        lastError: undefined,
      }));

      let processedCount = 0;

      // Process jobs in parallel batches
      const PARALLEL_BATCH_SIZE = 10; // Process 5 entities at once

      Logger.info(
        `[${loggerCtx}] Starting parallel bulk sync with batch size ${PARALLEL_BATCH_SIZE}`,
      );

      while (jobQueue.length > 0) {
        // Take a batch of jobs
        const currentBatch = jobQueue.splice(0, PARALLEL_BATCH_SIZE);

        Logger.info(
          `[${loggerCtx}] Processing batch of ${currentBatch.length} ${entityType.toLowerCase()}s in parallel`,
        );

        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          currentBatch.map(async (job) => {
            job.attempts++;

            Logger.debug(
              `[${loggerCtx}] Processing ${entityType.toLowerCase()} ${job.entity.id} (attempt ${job.attempts}/${job.maxAttempts})`,
            );

            try {
              await syncMethod({
                entityType,
                entityId: job.entity.id,
                operationType: "update",
                timestamp: new Date().toISOString(),
                retryCount: 0,
              });

              return { job, success: true };
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              job.lastError = errorMessage;

              Logger.error(
                `[${loggerCtx}] Attempt ${job.attempts} failed for ${entityType.toLowerCase()} ${job.entity.id}: ${errorMessage}`,
              );

              return { job, success: false, error: errorMessage };
            }
          }),
        );

        // Process results
        for (const result of batchResults) {
          if (result.status === "fulfilled") {
            const { job, success, error } = result.value;

            if (success) {
              successCount++;
              processedCount++;
              Logger.debug(
                `[${loggerCtx}] Successfully synced ${entityType.toLowerCase()} ${job.entity.id}`,
              );
            } else {
              // Retry logic
              if (job.attempts < job.maxAttempts) {
                Logger.info(
                  `[${loggerCtx}] Requeuing ${entityType.toLowerCase()} ${job.entity.id} for retry (attempt ${job.attempts + 1}/${job.maxAttempts})`,
                );
                jobQueue.push(job);
              } else {
                // Max attempts reached
                errorCount++;
                processedCount++;
                finalErrors.push({
                  entityId: job.entity.id,
                  error: `Failed after ${job.maxAttempts} attempts. Last error: ${job.lastError}`,
                  attempts: job.attempts,
                });
                Logger.error(
                  `[${loggerCtx}] ${entityType} ${job.entity.id} failed permanently after ${job.maxAttempts} attempts`,
                );
              }
            }
          }
        }

        // Progress logging
        Logger.info(
          `[${loggerCtx}] Progress: ${processedCount}/${totalEntities} processed, ${successCount} successful, ${errorCount} failed, ${jobQueue.length} remaining`,
        );
      }

      const duration = Date.now() - startTime;
      const result = {
        success: errorCount === 0,
        totalEntities,
        successCount,
        errorCount,
        errors: finalErrors,
      };

      Logger.info(
        `[${loggerCtx}] Bulk ${entityType.toLowerCase()} sync completed in ${duration}ms: ${successCount}/${totalEntities} successful, ${errorCount} permanently failed`,
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `[${loggerCtx}] Bulk ${entityType.toLowerCase()} sync failed: ${errorMessage}`,
      );

      return {
        success: false,
        totalEntities: 0,
        successCount,
        errorCount: errorCount + 1,
        errors: [
          ...finalErrors,
          { entityId: -1, error: errorMessage, attempts: 1 },
        ],
      };
    }
  }

  /**
   * Syncs all products in the database to the CMS.
   * Uses parallel batch processing for improved performance.
   * @returns Promise<SyncResult> - Summary of sync operation results including counts and errors
   */
  async syncAllProductsToCms(): Promise<{
    success: boolean;
    totalProducts: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
      productId: number | string;
      error: string;
      attempts: number;
    }>;
  }> {
    const result = await this.syncAllEntitiesToCmsGeneric(
      "Product",
      Product,
      this.syncProductToCms.bind(this),
    );

    return {
      success: result.success,
      totalProducts: result.totalEntities,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors.map((e) => ({
        productId: e.entityId,
        error: e.error,
        attempts: e.attempts,
      })),
    };
  }

  /**
   * Syncs all entity types to the CMS in sequence.
   * Runs product, variant, and collection syncing operations one after another.
   * @returns Promise<void> - Completes when all entity types have been synced
   */
  async syncAllEntityTypes() {
    await this.syncAllProductsToCms();
    await this.syncAllProductVariantsToCms();
    await this.syncAllCollectionsToCms();
  }

  /**
   * Syncs all product variants in the database to the CMS.
   * Uses parallel batch processing with rate limiting and retry logic.
   * @returns Promise<SyncResult> - Summary of sync operation results including counts and errors
   */
  async syncAllProductVariantsToCms(): Promise<{
    success: boolean;
    totalProductVariants: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
      productVariantId: number | string;
      error: string;
      attempts: number;
    }>;
  }> {
    const result = await this.syncAllEntitiesToCmsGeneric(
      "ProductVariant",
      ProductVariant,
      this.syncVariantToCms.bind(this),
    );

    return {
      success: result.success,
      totalProductVariants: result.totalEntities,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors.map((e) => ({
        productVariantId: e.entityId,
        error: e.error,
        attempts: e.attempts,
      })),
    };
  }

  /**
   * Syncs all collections in the database to the CMS.
   * Uses parallel batch processing with rate limiting and retry logic.
   * @returns Promise<SyncResult> - Summary of sync operation results including counts and errors
   */
  async syncAllCollectionsToCms(): Promise<{
    success: boolean;
    totalCollections: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
      collectionId: number | string;
      error: string;
      attempts: number;
    }>;
  }> {
    const result = await this.syncAllEntitiesToCmsGeneric(
      "Collection",
      Collection,
      this.syncCollectionToCms.bind(this),
    );

    return {
      success: result.success,
      totalCollections: result.totalEntities,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors.map((e) => ({
        collectionId: e.entityId,
        error: e.error,
        attempts: e.attempts,
      })),
    };
  }

  /**
   * Syncs a single product to the CMS.
   * Handles create, update, or delete operations based on job data.
   * @param jobData - The job data containing entity info and operation type
   * @returns Promise<SyncResponse> - Result of the sync operation with success status and message
   */
  async syncProductToCms(jobData: SyncJobData): Promise<SyncResponse> {
    try {
      // Fetch fresh product data from database
      const product = await this.connection.rawConnection
        .getRepository(Product)
        .findOne({
          where: { id: jobData.entityId },
          relations: { translations: true },
        });

      const operationType = jobData.operationType;
      const defaultLanguageCode = await this.getDefaultLanguageCode();

      if (!product) {
        throw new Error(`Product with ID ${jobData.entityId} not found`);
      }

      // Get product slug for variant lookups
      const productSlug = this.translationUtils.getSlugByLanguage(
        product.translations,
        defaultLanguageCode,
      );

      await this.sanityService.syncProduct({
        product,
        defaultLanguageCode,
        operationType,
        productSlug,
      });

      return {
        success: true,
        message: `Product ${jobData.operationType} synced successfully`,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "";
      Logger.error(
        `[${loggerCtx}] Product sync failed: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        message: `Product sync failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Syncs a single product variant to the CMS.
   * Handles create, update, or delete operations and resolves related collections.
   * @param jobData - The job data containing entity info and operation type
   * @returns Promise<SyncResponse> - Result of the sync operation with success status and message
   */
  async syncVariantToCms(jobData: SyncJobData): Promise<SyncResponse> {
    try {
      // Create RequestContext for service calls
      const ctx = await this.requestContextService.create({
        apiType: "admin",
        languageCode: await this.getDefaultLanguageCode(),
        channelOrToken: await this.channelService.getDefaultChannel(),
      });

      // Fetch fresh variant data from database with product relation
      const variant = await this.connection.rawConnection
        .getRepository(ProductVariant)
        .findOne({
          where: { id: jobData.entityId },
          relations: ["translations", "product", "product.translations"],
        });

      const operationType = jobData.operationType;
      const defaultLanguageCode = await this.getDefaultLanguageCode();

      if (!variant) {
        throw new Error(`ProductVariant with ID ${jobData.entityId} not found`);
      }

      // Generate variant slug from parent product slug + variant ID
      const productSlug = this.translationUtils.getSlugByLanguage(
        variant.product.translations,
        defaultLanguageCode,
      );
      const variantSlug = productSlug
        ? `${productSlug}-variant-${variant.id}`
        : `variant-${variant.id}`;

      // Find collections for this variant
      const collections = await this.findCollectionsForVariant(ctx, variant.id);

      await this.sanityService.syncProductVariant({
        variant,
        defaultLanguageCode,
        operationType,
        variantSlug,
        collections,
      });

      return {
        success: true,
        message: `Variant ${jobData.operationType} synced successfully`,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "";
      Logger.error(
        `[${loggerCtx}] Variant sync failed: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        message: `Variant sync failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Syncs a single collection to the CMS.
   * Handles create, update, or delete operations and resolves related variants.
   * @param jobData - The job data containing entity info and operation type
   * @returns Promise<SyncResponse> - Result of the sync operation with success status and message
   */
  async syncCollectionToCms(jobData: SyncJobData): Promise<SyncResponse> {
    try {
      // Create RequestContext for service calls
      const ctx = await this.requestContextService.create({
        apiType: "admin",
        languageCode: await this.getDefaultLanguageCode(),
        channelOrToken: await this.channelService.getDefaultChannel(),
      });

      // Fetch fresh collection data from database
      const collection = await this.connection.rawConnection
        .getRepository(Collection)
        .findOne({
          where: { id: jobData.entityId },
          relations: ["translations"],
        });

      if (!collection) {
        throw new Error(`Collection with ID ${jobData.entityId} not found`);
      }

      const operationType = jobData.operationType;
      const defaultLanguageCode = await this.getDefaultLanguageCode();

      // Get collection slug for the sync operation
      const collectionSlug = this.translationUtils.getSlugByLanguage(
        collection.translations,
        defaultLanguageCode,
      );

      // Find variants for this collection
      const variants = await this.findVariantsForCollection(ctx, collection.id);

      await this.sanityService.syncCollection({
        collection,
        defaultLanguageCode,
        operationType,
        collectionSlug,
        variants,
      });

      return {
        success: true,
        message: `Collection ${jobData.operationType} synced successfully`,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "";
      Logger.error(
        `[${loggerCtx}] Collection sync failed: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        message: `Collection sync failed: ${errorMessage}`,
      };
    }
  }
}
