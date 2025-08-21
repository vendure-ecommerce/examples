/**
 * CloudFlare R2 Asset Storage Plugin for Vendure
 * 
 * This plugin provides CloudFlare R2 object storage integration for Vendure's
 * AssetServerPlugin. CloudFlare R2 offers S3-compatible object storage with
 * zero egress fees and global edge network distribution.
 * 
 * @example
 * ```typescript
 * import { AssetServerPlugin } from '@vendure/asset-server-plugin';
 * import { configureCloudFlareR2Storage, createR2ConfigFromEnv } from './plugins/cloudflare-r2-storage';
 * 
 * // In vendure-config.ts
 * AssetServerPlugin.init({
 *   route: 'assets',
 *   assetUploadDir: path.join(__dirname, '../static/assets'),
 *   storageStrategyFactory: () => configureCloudFlareR2Storage(
 *     createR2ConfigFromEnv()
 *   ),
 * })
 * ```
 */

// Core strategy implementation
export { CloudFlareR2AssetStorageStrategy } from './cloudflare-r2-asset-storage-strategy.js';

// Configuration helpers
export { 
    configureCloudFlareR2Storage,
    createR2ConfigFromEnv,
    createR2StorageFactory 
} from './configure-cloudflare-r2-storage.js';

// Types and interfaces
export type { 
    CloudFlareR2Config, 
    CloudFlareR2EnvironmentConfig 
} from './types.js';

// Constants and metadata
export { 
    CLOUDFLARE_R2_OPTIONS,
    PLUGIN_METADATA,
    DEFAULT_R2_CONFIG,
    R2_ENDPOINTS,
    R2_ERROR_MESSAGES 
} from './constants.js';