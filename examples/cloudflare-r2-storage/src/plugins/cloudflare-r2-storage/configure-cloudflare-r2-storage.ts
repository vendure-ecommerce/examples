/**
 * CloudFlare R2 Asset Storage Configuration Helper
 * 
 * Provides a convenient factory function for configuring CloudFlare R2 storage
 * with Vendure's AssetServerPlugin. This follows the same pattern as Vendure's
 * built-in configureS3AssetStorage helper.
 */

import { AssetStorageStrategy } from '@vendure/core';
import { CloudFlareR2AssetStorageStrategy } from './cloudflare-r2-asset-storage-strategy.js';
import { CloudFlareR2Config, CloudFlareR2EnvironmentConfig } from './types.js';
import { DEFAULT_R2_CONFIG } from './constants.js';

/**
 * Configuration factory for CloudFlare R2 asset storage
 * 
 * This function creates a properly configured CloudFlareR2AssetStorageStrategy
 * that can be used with Vendure's AssetServerPlugin.
 * 
 * @param config - CloudFlare R2 configuration options
 * @returns AssetStorageStrategy instance for use with AssetServerPlugin
 * 
 * @example
 * ```typescript
 * import { AssetServerPlugin } from '@vendure/asset-server-plugin';
 * import { configureCloudFlareR2Storage } from './plugins/cloudflare-r2-storage';
 * 
 * // In vendure-config.ts
 * AssetServerPlugin.init({
 *   route: 'assets',
 *   assetUploadDir: path.join(__dirname, '../static/assets'),
 *   storageStrategyFactory: () => configureCloudFlareR2Storage({
 *     accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
 *     accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
 *     secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
 *     bucket: process.env.CLOUDFLARE_R2_BUCKET!,
 *     customDomain: process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN,
 *   }),
 * })
 * ```
 */
export function configureCloudFlareR2Storage(config: CloudFlareR2Config): AssetStorageStrategy {
    // Merge with defaults
    const finalConfig: CloudFlareR2Config = {
        ...DEFAULT_R2_CONFIG,
        ...config,
    };

    return new CloudFlareR2AssetStorageStrategy(finalConfig);
}

/**
 * Creates CloudFlare R2 configuration from environment variables
 * 
 * This helper function reads CloudFlare R2 configuration from environment
 * variables, providing a convenient way to configure the storage strategy
 * in production environments.
 * 
 * @param envConfig - Optional environment configuration object
 * @returns CloudFlareR2Config object
 * 
 * @example
 * ```typescript
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
export function createR2ConfigFromEnv(
    envConfig: CloudFlareR2EnvironmentConfig = process.env as CloudFlareR2EnvironmentConfig
): CloudFlareR2Config {
    const {
        CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_R2_ACCESS_KEY_ID,
        CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        CLOUDFLARE_R2_BUCKET,
        CLOUDFLARE_R2_CUSTOM_DOMAIN,
        CLOUDFLARE_R2_REGION,
        CLOUDFLARE_R2_USE_HTTPS,
    } = envConfig;

    if (!CLOUDFLARE_ACCOUNT_ID) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required');
    }
    if (!CLOUDFLARE_R2_ACCESS_KEY_ID) {
        throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID environment variable is required');
    }
    if (!CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
        throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY environment variable is required');
    }
    if (!CLOUDFLARE_R2_BUCKET) {
        throw new Error('CLOUDFLARE_R2_BUCKET environment variable is required');
    }

    return {
        accountId: CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        bucket: CLOUDFLARE_R2_BUCKET,
        customDomain: CLOUDFLARE_R2_CUSTOM_DOMAIN,
        region: CLOUDFLARE_R2_REGION || DEFAULT_R2_CONFIG.region,
        useHttps: CLOUDFLARE_R2_USE_HTTPS !== 'false',
    };
}

/**
 * Creates a CloudFlare R2 storage strategy factory for development
 * 
 * This function provides a development-friendly configuration that includes
 * fallback values and better error messages for missing configuration.
 * 
 * @param config - Partial CloudFlare R2 configuration with fallbacks
 * @returns Function that returns AssetStorageStrategy
 */
export function createR2StorageFactory(
    config: Partial<CloudFlareR2Config> = {}
): () => AssetStorageStrategy {
    return () => {
        // Provide development defaults with clear error messages
        const finalConfig: CloudFlareR2Config = {
            accountId: config.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || (() => {
                throw new Error('CloudFlare Account ID is required. Set CLOUDFLARE_ACCOUNT_ID environment variable.');
            })(),
            accessKeyId: config.accessKeyId || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || (() => {
                throw new Error('CloudFlare R2 Access Key ID is required. Set CLOUDFLARE_R2_ACCESS_KEY_ID environment variable.');
            })(),
            secretAccessKey: config.secretAccessKey || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || (() => {
                throw new Error('CloudFlare R2 Secret Access Key is required. Set CLOUDFLARE_R2_SECRET_ACCESS_KEY environment variable.');
            })(),
            bucket: config.bucket || process.env.CLOUDFLARE_R2_BUCKET || 'vendure-assets',
            customDomain: config.customDomain || process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN,
            region: config.region || process.env.CLOUDFLARE_R2_REGION || DEFAULT_R2_CONFIG.region,
            useHttps: config.useHttps ?? (process.env.CLOUDFLARE_R2_USE_HTTPS !== 'false'),
        };

        return configureCloudFlareR2Storage(finalConfig);
    };
}