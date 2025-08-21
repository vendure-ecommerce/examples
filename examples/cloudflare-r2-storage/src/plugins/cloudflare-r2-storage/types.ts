/**
 * CloudFlare R2 Asset Storage Strategy Configuration
 * 
 * Defines the configuration options for integrating CloudFlare R2 object storage
 * with Vendure's AssetServerPlugin. CloudFlare R2 is S3-compatible and provides
 * cost-effective object storage without egress fees.
 */

export interface CloudFlareR2Config {
    /**
     * CloudFlare Account ID - required for R2 endpoint construction
     * Format: https://{accountId}.r2.cloudflarestorage.com
     */
    accountId: string;

    /**
     * R2 Access Key ID - generated from CloudFlare Dashboard
     * Used for authentication with R2 API
     */
    accessKeyId: string;

    /**
     * R2 Secret Access Key - generated from CloudFlare Dashboard
     * Used for authentication with R2 API
     */
    secretAccessKey: string;

    /**
     * R2 bucket name where assets will be stored
     * Must be created in CloudFlare R2 dashboard before use
     */
    bucket: string;

    /**
     * Optional custom domain for asset serving
     * If not provided, will use R2's default public URL
     * Format: https://assets.example.com
     */
    customDomain?: string;

    /**
     * Optional region configuration
     * R2 uses "auto" by default but can be overridden
     */
    region?: string;

    /**
     * Whether to use HTTPS for asset URLs
     * Defaults to true for security
     */
    useHttps?: boolean;
}

/**
 * Environment variable mapping for CloudFlare R2 configuration
 * Provides fallback values for production deployment
 */
export interface CloudFlareR2EnvironmentConfig {
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
    CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
    CLOUDFLARE_R2_BUCKET?: string;
    CLOUDFLARE_R2_CUSTOM_DOMAIN?: string;
    CLOUDFLARE_R2_REGION?: string;
    CLOUDFLARE_R2_USE_HTTPS?: string;
}