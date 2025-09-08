import { ID } from "@vendure/common/lib/shared-types";
import { Collection, Product, ProductVariant } from "@vendure/core";

/**
 * @description
 * The plugin can be configured using the following options:
 */
export interface PluginInitOptions {
  cmsApiUrl?: string;
  cmsApiKey?: string;
  strapiBaseUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
  enableScheduledSync?: boolean;
  scheduledSyncCron?: string;
}

/**
 * @description
 * Job data structure for CMS sync operations.
 * Uses entity ID references for efficient serialization and storage.
 */
export interface SyncJobData {
  entityType: string;
  entityId: ID;
  operationType: OperationType;
  timestamp: string;
  retryCount: number;
}

/**
 * @description
 * Response type for manual sync operations
 */
export interface SyncResponse {
  success: boolean;
  message: string;
  timestamp?: Date;
}

export type OperationType = "create" | "update" | "delete";
