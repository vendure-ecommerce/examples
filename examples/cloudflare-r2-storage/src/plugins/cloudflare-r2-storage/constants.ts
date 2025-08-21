/**
 * CloudFlare R2 Asset Storage Strategy Constants
 * 
 * Contains plugin metadata, injection tokens, and configuration constants
 * for the CloudFlare R2 integration with Vendure.
 */

// We'll use a simple string token instead of InjectionToken for simplicity
import { CloudFlareR2Config } from './types.js';

/**
 * Injection token for CloudFlare R2 configuration options
 * Used by NestJS dependency injection system
 */
export const CLOUDFLARE_R2_OPTIONS = 'CLOUDFLARE_R2_OPTIONS';

/**
 * Plugin metadata and identifiers
 */
export const PLUGIN_METADATA = {
    name: 'CloudFlareR2StoragePlugin',
    version: '1.0.0',
    description: 'CloudFlare R2 object storage integration for Vendure assets',
    compatibility: '^2.0.0',
} as const;

/**
 * Default configuration values for CloudFlare R2
 */
export const DEFAULT_R2_CONFIG = {
    region: 'auto',
    useHttps: true,
} as const;

/**
 * CloudFlare R2 endpoint configuration
 */
export const R2_ENDPOINTS = {
    /**
     * Standard R2 API endpoint pattern
     * Format: https://{accountId}.r2.cloudflarestorage.com
     */
    getApiEndpoint: (accountId: string): string => 
        `https://${accountId}.r2.cloudflarestorage.com`,
    
    /**
     * Public URL pattern for assets (when no custom domain)
     * Format: https://pub-{hash}.r2.dev/{object-key}
     */
    getPublicUrlPattern: (bucket: string): string => 
        `https://pub-{hash}.r2.dev`,
} as const;

/**
 * Error messages for CloudFlare R2 operations
 */
export const R2_ERROR_MESSAGES = {
    MISSING_CONFIG: 'CloudFlare R2 configuration is missing or invalid',
    MISSING_ACCOUNT_ID: 'CloudFlare Account ID is required',
    MISSING_CREDENTIALS: 'CloudFlare R2 access credentials are required',
    MISSING_BUCKET: 'CloudFlare R2 bucket name is required',
    UPLOAD_FAILED: 'Failed to upload file to CloudFlare R2',
    DOWNLOAD_FAILED: 'Failed to download file from CloudFlare R2',
    DELETE_FAILED: 'Failed to delete file from CloudFlare R2',
    FILE_NOT_FOUND: 'File not found in CloudFlare R2',
} as const;