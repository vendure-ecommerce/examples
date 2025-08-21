import { PluginCommonModule, Type, VendurePlugin, Logger } from '@vendure/core';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import path from 'path';

import { MINIO_S3_STORAGE_PLUGIN_OPTIONS, loggerCtx } from './constants';
import { MinioS3StorageOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [{ provide: MINIO_S3_STORAGE_PLUGIN_OPTIONS, useFactory: () => MinioS3StoragePlugin.options }],
    configuration: config => {
        const options = MinioS3StoragePlugin.options;
        if (!options) {
            Logger.warn('MinioS3StoragePlugin options not configured', loggerCtx);
            return config;
        }

        // Apply default values with environment variable fallbacks
        const resolvedOptions = MinioS3StoragePlugin.resolveOptions(options);

        Logger.info(`MinIO S3 Storage configured with endpoint: ${resolvedOptions.endpoint}`, loggerCtx);
        Logger.info(`MinIO bucket: ${resolvedOptions.bucket}`, loggerCtx);
        Logger.info(`Local fallback enabled: ${resolvedOptions.enableLocalFallback}`, loggerCtx);

        // Configure AssetServerPlugin with MinIO S3 storage or local fallback
        const assetServerConfig = MinioS3StoragePlugin.createAssetServerConfig(resolvedOptions);
        
        // Find existing AssetServerPlugin and replace its configuration
        const existingAssetPluginIndex = config.plugins.findIndex(
            plugin => plugin && (plugin as any).constructor?.name === 'AssetServerPlugin'
        );

        if (existingAssetPluginIndex >= 0) {
            // Replace existing AssetServerPlugin configuration
            config.plugins[existingAssetPluginIndex] = assetServerConfig;
        } else {
            // Add AssetServerPlugin if not present
            config.plugins.push(assetServerConfig);
        }

        return config;
    },
    compatibility: '^3.0.0',
})
export class MinioS3StoragePlugin {
    static options: MinioS3StorageOptions;

    static init(options: MinioS3StorageOptions): Type<MinioS3StoragePlugin> {
        this.options = options;
        return MinioS3StoragePlugin;
    }

    /**
     * Resolve options with defaults and environment variable fallbacks
     */
    static resolveOptions(options: MinioS3StorageOptions): Omit<Required<MinioS3StorageOptions>, 'localAssetUrlPrefix'> & { localAssetUrlPrefix?: string } {
        return {
            endpoint: options.endpoint || process.env.MINIO_ENDPOINT || 'http://localhost:9000',
            accessKey: options.accessKey || process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: options.secretKey || process.env.MINIO_SECRET_KEY || 'minioadmin',
            bucket: options.bucket || process.env.MINIO_BUCKET || 'vendure-assets',
            region: options.region || process.env.MINIO_REGION || 'us-east-1',
            enableLocalFallback: options.enableLocalFallback ?? (process.env.ENABLE_LOCAL_FALLBACK === 'true'),
            localAssetUploadDir: options.localAssetUploadDir || './static/assets',
            localAssetUrlPrefix: options.localAssetUrlPrefix,
        };
    }

    /**
     * Create AssetServerPlugin configuration based on resolved options
     */
    static createAssetServerConfig(options: Omit<Required<MinioS3StorageOptions>, 'localAssetUrlPrefix'> & { localAssetUrlPrefix?: string }) {
        const isDev = process.env.APP_ENV === 'dev';

        if (options.enableLocalFallback) {
            Logger.info('Using local storage fallback', loggerCtx);
            return AssetServerPlugin.init({
                route: 'assets',
                assetUploadDir: path.resolve(options.localAssetUploadDir),
                assetUrlPrefix: options.localAssetUrlPrefix || (isDev ? undefined : 'https://www.my-shop.com/assets/'),
            });
        }

        Logger.info('Using MinIO S3 storage', loggerCtx);
        return AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.resolve(options.localAssetUploadDir),
            storageStrategyFactory: configureS3AssetStorage({
                bucket: options.bucket,
                credentials: {
                    accessKeyId: options.accessKey,
                    secretAccessKey: options.secretKey,
                },
                nativeS3Configuration: {
                    endpoint: options.endpoint,
                    forcePathStyle: true,
                    signatureVersion: 'v4',
                    region: options.region,
                },
            }),
            assetUrlPrefix: `${options.endpoint}/${options.bucket}/`,
        });
    }
}
