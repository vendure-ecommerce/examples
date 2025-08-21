/**
 * @description
 * Configuration options for the MinIO S3 Storage Plugin.
 * This plugin provides S3-compatible object storage using MinIO.
 */
export interface MinioS3StorageOptions {
    /**
     * MinIO server endpoint URL
     * @default 'http://localhost:9000'
     */
    endpoint?: string;
    
    /**
     * MinIO access key (username)
     * @default 'minioadmin'
     */
    accessKey?: string;
    
    /**
     * MinIO secret key (password)
     * @default 'minioadmin'
     */
    secretKey?: string;
    
    /**
     * MinIO bucket name for storing assets
     * @default 'vendure-assets'
     */
    bucket?: string;
    
    /**
     * AWS region for compatibility
     * @default 'us-east-1'
     */
    region?: string;
    
    /**
     * Enable local fallback storage when MinIO is unavailable
     * @default false
     */
    enableLocalFallback?: boolean;
    
    /**
     * Local asset upload directory (used when local fallback is enabled)
     * @default './static/assets'
     */
    localAssetUploadDir?: string;
    
    /**
     * Asset URL prefix for local storage (used when local fallback is enabled)
     * @default undefined (uses default Vendure behavior)
     */
    localAssetUrlPrefix?: string;
}
