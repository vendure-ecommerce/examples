/**
 * CloudFlare R2 Asset Storage Strategy
 * 
 * Implements Vendure's AssetStorageStrategy interface for CloudFlare R2 object storage.
 * Provides seamless integration with CloudFlare R2's S3-compatible API using AWS SDK v3.
 * 
 * Key Features:
 * - S3-compatible API using @aws-sdk/client-s3
 * - Cost-effective storage with zero egress fees
 * - Global edge network for fast asset delivery
 * - Custom domain support for branded asset URLs
 */

import { AssetStorageStrategy, Logger } from '@vendure/core';
import { 
    S3Client, 
    PutObjectCommand, 
    GetObjectCommand, 
    DeleteObjectCommand,
    HeadObjectCommand 
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { CloudFlareR2Config } from './types.js';
import { DEFAULT_R2_CONFIG, R2_ENDPOINTS, R2_ERROR_MESSAGES } from './constants.js';

export class CloudFlareR2AssetStorageStrategy implements AssetStorageStrategy {
    private readonly s3Client: S3Client;
    private readonly logger = new Logger();

    constructor(private readonly config: CloudFlareR2Config) {
        this.validateConfig(config);
        
        // Initialize S3 client with CloudFlare R2 configuration
        this.s3Client = new S3Client({
            region: config.region || DEFAULT_R2_CONFIG.region,
            endpoint: R2_ENDPOINTS.getApiEndpoint(config.accountId),
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            // R2 doesn't require these but AWS SDK expects them
            forcePathStyle: true,
        });

        Logger.info(`CloudFlare R2 Asset Storage initialized for bucket: ${config.bucket}`, 'CloudFlareR2AssetStorageStrategy');
    }

    /**
     * Writes a file from a Buffer to CloudFlare R2
     * @param fileName - The name/key of the file in R2
     * @param data - The file data as a Buffer
     * @returns Promise<string> - The file identifier (key) in R2
     */
    async writeFileFromBuffer(fileName: string, data: Buffer): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.config.bucket,
                Key: fileName,
                Body: data,
                ContentType: this.getContentType(fileName),
            });

            await this.s3Client.send(command);
            Logger.debug(`Successfully uploaded file to R2: ${fileName}`, 'CloudFlareR2AssetStorageStrategy');
            return fileName;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`${R2_ERROR_MESSAGES.UPLOAD_FAILED}: ${fileName}`, 'CloudFlareR2AssetStorageStrategy');
            throw new Error(`${R2_ERROR_MESSAGES.UPLOAD_FAILED}: ${errorMessage}`);
        }
    }

    /**
     * Writes a file from a Stream to CloudFlare R2
     * @param fileName - The name/key of the file in R2
     * @param data - The file data as a readable stream
     * @returns Promise<string> - The file identifier (key) in R2
     */
    async writeFileFromStream(fileName: string, data: Readable): Promise<string> {
        try {
            const upload = new Upload({
                client: this.s3Client,
                params: {
                    Bucket: this.config.bucket,
                    Key: fileName,
                    Body: data,
                    ContentType: this.getContentType(fileName),
                },
            });

            await upload.done();
            Logger.debug(`Successfully streamed file to R2: ${fileName}`, 'CloudFlareR2AssetStorageStrategy');
            return fileName;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`${R2_ERROR_MESSAGES.UPLOAD_FAILED}: ${fileName}`, 'CloudFlareR2AssetStorageStrategy');
            throw new Error(`${R2_ERROR_MESSAGES.UPLOAD_FAILED}: ${errorMessage}`);
        }
    }

    /**
     * Reads a file from CloudFlare R2 as a Buffer
     * @param identifier - The file key in R2
     * @returns Promise<Buffer> - The file data as a Buffer
     */
    async readFileToBuffer(identifier: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.config.bucket,
                Key: identifier,
            });

            const response = await this.s3Client.send(command);
            
            if (!response.Body) {
                throw new Error(`${R2_ERROR_MESSAGES.FILE_NOT_FOUND}: ${identifier}`);
            }

            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            const stream = response.Body as Readable;
            
            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);
            Logger.debug(`Successfully downloaded file from R2: ${identifier}`, 'CloudFlareR2AssetStorageStrategy');
            return buffer;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`${R2_ERROR_MESSAGES.DOWNLOAD_FAILED}: ${identifier}`, 'CloudFlareR2AssetStorageStrategy');
            throw new Error(`${R2_ERROR_MESSAGES.DOWNLOAD_FAILED}: ${errorMessage}`);
        }
    }

    /**
     * Reads a file from CloudFlare R2 as a Stream
     * @param identifier - The file key in R2
     * @returns Promise<Readable> - The file data as a readable stream
     */
    async readFileToStream(identifier: string): Promise<Readable> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.config.bucket,
                Key: identifier,
            });

            const response = await this.s3Client.send(command);
            
            if (!response.Body) {
                throw new Error(`${R2_ERROR_MESSAGES.FILE_NOT_FOUND}: ${identifier}`);
            }

            Logger.debug(`Successfully streamed file from R2: ${identifier}`, 'CloudFlareR2AssetStorageStrategy');
            return response.Body as Readable;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`${R2_ERROR_MESSAGES.DOWNLOAD_FAILED}: ${identifier}`, 'CloudFlareR2AssetStorageStrategy');
            throw new Error(`${R2_ERROR_MESSAGES.DOWNLOAD_FAILED}: ${errorMessage}`);
        }
    }

    /**
     * Deletes a file from CloudFlare R2
     * @param identifier - The file key in R2
     * @returns Promise<void>
     */
    async deleteFile(identifier: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: identifier,
            });

            await this.s3Client.send(command);
            Logger.debug(`Successfully deleted file from R2: ${identifier}`, 'CloudFlareR2AssetStorageStrategy');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`${R2_ERROR_MESSAGES.DELETE_FAILED}: ${identifier}`, 'CloudFlareR2AssetStorageStrategy');
            throw new Error(`${R2_ERROR_MESSAGES.DELETE_FAILED}: ${errorMessage}`);
        }
    }

    /**
     * Checks if a file exists in CloudFlare R2
     * @param fileName - The file key to check
     * @returns Promise<boolean> - True if file exists, false otherwise
     */
    async fileExists(fileName: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.config.bucket,
                Key: fileName,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error: unknown) {
            // Handle the error properly by checking its properties
            if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
                return false;
            }
            Logger.error(`Error checking file existence: ${fileName}`, 'CloudFlareR2AssetStorageStrategy');
            return false;
        }
    }

    /**
     * Converts R2 file identifier to absolute URL
     * @param request - The HTTP request object
     * @param identifier - The file key in R2
     * @returns string - The absolute URL for the asset
     */
    toAbsoluteUrl(request: Request, identifier: string): string {
        const protocol = this.config.useHttps !== false ? 'https' : 'http';
        
        if (this.config.customDomain) {
            return `${protocol}://${this.config.customDomain}/${identifier}`;
        }

        // Use CloudFlare R2 public URL format
        // Note: In practice, you'll need to set up a custom domain or public bucket
        // for production use as R2 doesn't expose a direct public URL pattern
        return `${protocol}://${this.config.bucket}.${this.config.accountId}.r2.cloudflarestorage.com/${identifier}`;
    }

    /**
     * Validates the CloudFlare R2 configuration
     * @private
     */
    private validateConfig(config: CloudFlareR2Config): void {
        if (!config.accountId) {
            throw new Error(R2_ERROR_MESSAGES.MISSING_ACCOUNT_ID);
        }
        if (!config.accessKeyId || !config.secretAccessKey) {
            throw new Error(R2_ERROR_MESSAGES.MISSING_CREDENTIALS);
        }
        if (!config.bucket) {
            throw new Error(R2_ERROR_MESSAGES.MISSING_BUCKET);
        }
    }

    /**
     * Determines the content type based on file extension
     * @private
     */
    private getContentType(fileName: string): string {
        const ext = fileName.toLowerCase().split('.').pop();
        const contentTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'avif': 'image/avif',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
        };
        return contentTypes[ext || ''] || 'application/octet-stream';
    }
}