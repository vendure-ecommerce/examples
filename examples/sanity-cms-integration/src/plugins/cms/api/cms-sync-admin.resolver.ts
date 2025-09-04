import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Permission } from "@vendure/common/lib/generated-types";
import { ID } from "@vendure/common/lib/shared-types";
import { Allow, Ctx, RequestContext } from "@vendure/core";
import { CmsSyncService } from "../services/cms-sync.service";

@Resolver()
export class CmsSyncAdminResolver {
  constructor(private cmsSyncService: CmsSyncService) {}

  // Entity-agnostic mutations
  @Mutation()
  @Allow(Permission.SuperAdmin)
  async syncEntityToCms(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID; entityType: string },
  ): Promise<{
    success: boolean;
    message: string;
    entityId: string;
    entityType: string;
  }> {
    let result;
    
    // Route to the appropriate sync method based on entity type
    switch (args.entityType) {
      case "Product":
        result = await this.cmsSyncService.syncProductToCms({
          entityType: "Product",
          entityId: args.id,
          operationType: "update",
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
        break;
        
      case "ProductVariant":
        result = await this.cmsSyncService.syncVariantToCms({
          entityType: "ProductVariant",
          entityId: args.id,
          operationType: "update",
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
        break;
        
      case "Collection":
        result = await this.cmsSyncService.syncCollectionToCms({
          entityType: "Collection",
          entityId: args.id,
          operationType: "update",
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
        break;
        
      default:
        return {
          success: false,
          message: `Unsupported entity type: ${args.entityType}`,
          entityId: args.id.toString(),
          entityType: args.entityType,
        };
    }

    return {
      success: result.success,
      message: result.message,
      entityId: args.id.toString(),
      entityType: args.entityType,
    };
  }

  @Mutation()
  @Allow(Permission.SuperAdmin)
  async syncAllEntitiesToCms(
    @Ctx() ctx: RequestContext,
    @Args() args: { entityType: string },
  ): Promise<{
    success: boolean;
    totalEntities: number;
    successCount: number;
    errorCount: number;
    message: string;
    entityType: string;
    errors: Array<{
      entityId: string;
      entityType: string;
      error: string;
      attempts: number;
    }>;
  }> {
    // Route to appropriate bulk sync method
    switch (args.entityType) {
      case "Product": {
        const result = await this.cmsSyncService.syncAllProductsToCms();
        return {
          success: result.success,
          totalEntities: result.totalProducts,
          successCount: result.successCount,
          errorCount: result.errorCount,
          message: result.success 
            ? `Successfully synced ${result.successCount}/${result.totalProducts} ${args.entityType.toLowerCase()}s`
            : `Synced ${result.successCount}/${result.totalProducts} ${args.entityType.toLowerCase()}s, ${result.errorCount} failed permanently`,
          entityType: args.entityType,
          errors: result.errors.map(e => ({
            entityId: e.productId.toString(),
            entityType: args.entityType,
            error: e.error,
            attempts: e.attempts,
          })),
        };
      }
      
      case "ProductVariant": {
        const result = await this.cmsSyncService.syncAllProductVariantsToCms();
        return {
          success: result.success,
          totalEntities: result.totalProductVariants,
          successCount: result.successCount,
          errorCount: result.errorCount,
          message: result.success 
            ? `Successfully synced ${result.successCount}/${result.totalProductVariants} ${args.entityType.toLowerCase()}s`
            : `Synced ${result.successCount}/${result.totalProductVariants} ${args.entityType.toLowerCase()}s, ${result.errorCount} failed permanently`,
          entityType: args.entityType,
          errors: result.errors.map(e => ({
            entityId: e.productVariantId.toString(),
            entityType: args.entityType,
            error: e.error,
            attempts: e.attempts,
          })),
        };
      }
      
      case "Collection": {
        const result = await this.cmsSyncService.syncAllCollectionsToCms();
        return {
          success: result.success,
          totalEntities: result.totalCollections,
          successCount: result.successCount,
          errorCount: result.errorCount,
          message: result.success 
            ? `Successfully synced ${result.successCount}/${result.totalCollections} ${args.entityType.toLowerCase()}s`
            : `Synced ${result.successCount}/${result.totalCollections} ${args.entityType.toLowerCase()}s, ${result.errorCount} failed permanently`,
          entityType: args.entityType,
          errors: result.errors.map(e => ({
            entityId: e.collectionId.toString(),
            entityType: args.entityType,
            error: e.error,
            attempts: e.attempts,
          })),
        };
      }
      
      default:
        return {
          success: false,
          totalEntities: 0,
          successCount: 0,
          errorCount: 1,
          message: `Unsupported entity type: ${args.entityType}`,
          entityType: args.entityType,
          errors: [],
        };
    }
  }

  // Backwards compatibility - existing product-specific mutations
  @Mutation()
  @Allow(Permission.SuperAdmin)
  async syncProductToCms(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: ID },
  ): Promise<{
    success: boolean;
    message: string;
    entityId: string;
    entityType: string;
  }> {
    try {
      const result = await this.cmsSyncService.syncProductToCms({
        entityType: "Product",
        entityId: args.id,
        operationType: "update",
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });

      return {
        success: result.success,
        message: result.message,
        entityId: args.id.toString(),
        entityType: "Product",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to sync product: ${errorMessage}`,
        entityId: args.id.toString(),
        entityType: "Product",
      };
    }
  }

  @Mutation()
  @Allow(Permission.SuperAdmin)
  async syncAllProductsToCms(@Ctx() ctx: RequestContext): Promise<{
    success: boolean;
    totalEntities: number;
    successCount: number;
    errorCount: number;
    message: string;
    entityType: string;
    errors: Array<{
      entityId: string;
      entityType: string;
      error: string;
      attempts: number;
    }>;
  }> {
    try {
      const result = await this.cmsSyncService.syncAllProductsToCms();
      
      return {
        success: result.success,
        totalEntities: result.totalProducts,
        successCount: result.successCount,
        errorCount: result.errorCount,
        message: result.success 
          ? `Successfully synced ${result.successCount}/${result.totalProducts} products`
          : `Synced ${result.successCount}/${result.totalProducts} products, ${result.errorCount} failed permanently`,
        entityType: "Product",
        errors: result.errors.map(e => ({
          entityId: e.productId.toString(),
          entityType: "Product",
          error: e.error,
          attempts: e.attempts,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        totalEntities: 0,
        successCount: 0,
        errorCount: 1,
        message: `Bulk sync failed: ${errorMessage}`,
        entityType: "Product",
        errors: [],
      };
    }
  }

  @Query()
  @Allow(Permission.SuperAdmin)
  async getCmsSyncStatus(@Ctx() ctx: RequestContext): Promise<string> {
    return "CMS Sync service is ready";
  }
}
