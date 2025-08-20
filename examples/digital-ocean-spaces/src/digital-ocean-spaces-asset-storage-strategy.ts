import { PutObjectRequest, S3ClientConfig } from '@aws-sdk/client-s3';
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { AssetStorageStrategy, Logger } from '@vendure/core';
import { Request } from 'express';
import * as path from 'node:path';
import { Readable } from 'node:stream';

const loggerCtx = 'DigitalOceanSpacesAssetStorageStrategy';

/**
 * @description
 * Configuration for connecting to DigitalOcean Spaces.
 */
export interface DigitalOceanSpacesConfig {
    /**
     * @description
     * The credentials used to access your DigitalOcean Spaces. You can supply either the access key ID & secret.
     */
    credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
    /**
     * @description
     * The DigitalOcean Spaces bucket in which to store the assets. If it does not exist, it will be created on startup.
     */
    bucket: string;
    /**
     * @description
     * The DigitalOcean Spaces region (e.g., 'nyc3', 'ams3', 'sgp1')
     */
    region: string;
    /**
     * @description
     * The DigitalOcean Spaces endpoint URL. If not provided, it will be constructed from the region.
     */
    endpoint?: string;
    /**
     * @description
     * Configuration object passed directly to the AWS SDK S3 client.
     */
    nativeS3Configuration?: any;
    /**
     * @description
     * Configuration object passed directly to the AWS SDK upload options.
     */
    nativeS3UploadConfiguration?: any;
}

/**
 * @description
 * Returns a configured instance of the {@link DigitalOceanSpacesAssetStorageStrategy} which can then be passed to the {@link AssetServerOptions}
 * `storageStrategyFactory` property.
 *
 * Before using this strategy, make sure you have the `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` package installed:
 *
 * ```sh
 * npm install \@aws-sdk/client-s3 \@aws-sdk/lib-storage
 * ```
 *
 * @example
 * ```ts
 * import { AssetServerPlugin } from '\@vendure/asset-server-plugin';
 * import { configureDigitalOceanSpacesAssetStorage } from './digital-ocean-spaces-asset-storage-strategy';
 * import { DefaultAssetNamingStrategy } from '\@vendure/core';
 *
 * // ...
 *
 * plugins: [
 *   AssetServerPlugin.init({
 *     route: 'assets',
 *     assetUploadDir: path.join(__dirname, 'assets'),
 *     namingStrategy: new DefaultAssetNamingStrategy(),
 *     storageStrategyFactory: configureDigitalOceanSpacesAssetStorage({
 *       bucket: 'my-digital-ocean-space',
 *       region: 'nyc3',
 *       credentials: {
 *         accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
 *         secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
 *       },
 *     }),
 *   }),
 * ]
 * ```
 */
export function configureDigitalOceanSpacesAssetStorage(spacesConfig: DigitalOceanSpacesConfig) {
    return (options: any) => {
        const getAssetUrlPrefix = (request: Request, identifier: string): string => {
            if (!options.assetUrlPrefix) {
                const protocol = request.protocol;
                const host = request.get('host');
                return `${protocol}://${host}/${options.route}/`;
            }
            const assetUrlPrefix = options.assetUrlPrefix;
            return assetUrlPrefix.endsWith('/') ? assetUrlPrefix : `${assetUrlPrefix}/`;
        };
        
        const toAbsoluteUrlFn = (request: Request, identifier: string): string => {
            if (!identifier) {
                return '';
            }
            const prefix = getAssetUrlPrefix(request, identifier);
            return identifier.startsWith(prefix) ? identifier : `${prefix}${identifier}`;
        };
        
        return new DigitalOceanSpacesAssetStorageStrategy(spacesConfig, toAbsoluteUrlFn);
    };
}

/**
 * @description
 * An {@link AssetStorageStrategy} which uses DigitalOcean Spaces object storage service.
 * DigitalOcean Spaces is S3-compatible, so this implementation uses the AWS SDK.
 *
 * Before using this strategy, make sure you have the `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` package installed:
 *
 * ```sh
 * npm install \@aws-sdk/client-s3 \@aws-sdk/lib-storage
 * ```
 *
 * **Note:** Rather than instantiating this manually, use the {@link configureDigitalOceanSpacesAssetStorage} function.
 */
export class DigitalOceanSpacesAssetStorageStrategy implements AssetStorageStrategy {
    private AWS: typeof import('@aws-sdk/client-s3');
    private libStorage: typeof import('@aws-sdk/lib-storage');
    private s3Client: import('@aws-sdk/client-s3').S3Client;

    constructor(
        private spacesConfig: DigitalOceanSpacesConfig,
        public readonly toAbsoluteUrl: (request: Request, identifier: string) => string,
    ) {}

    async init() {
        try {
            this.AWS = await import('@aws-sdk/client-s3');
        } catch (err: any) {
            Logger.error(
                'Could not find the "@aws-sdk/client-s3" package. Make sure it is installed',
                loggerCtx,
                err.stack,
            );
        }

        try {
            this.libStorage = await import('@aws-sdk/lib-storage');
        } catch (err: any) {
            Logger.error(
                'Could not find the "@aws-sdk/lib-storage" package. Make sure it is installed',
                loggerCtx,
                err.stack,
            );
        }

        const endpoint = this.spacesConfig.endpoint || `https://${this.spacesConfig.region}.digitaloceanspaces.com`;

        const config = {
            ...this.spacesConfig.nativeS3Configuration,
            endpoint,
            region: 'us-east-1', // DigitalOcean Spaces requires this to be set to us-east-1
            credentials: await this.getCredentials(),
            forcePathStyle: false, // Use virtual-hosted style URLs
        } satisfies S3ClientConfig;

        this.s3Client = new this.AWS.S3Client(config);

        await this.ensureBucket();
    }

    destroy?: (() => void | Promise<void>) | undefined;

    async writeFileFromBuffer(fileName: string, data: Buffer) {
        return this.writeFile(fileName, data);
    }

    async writeFileFromStream(fileName: string, data: Readable) {
        return this.writeFile(fileName, data);
    }

    async readFileToBuffer(identifier: string) {
        const body = await this.readFile(identifier);

        if (!body) {
            Logger.error(`Got undefined Body for ${identifier}`, loggerCtx);
            return Buffer.from('');
        }

        const chunks: Buffer[] = [];
        for await (const chunk of body) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    }

    async readFileToStream(identifier: string) {
        const body = await this.readFile(identifier);

        if (!body) {
            return new Readable({
                read() {
                    this.push(null);
                },
            });
        }

        return body;
    }

    private async readFile(identifier: string) {
        const { GetObjectCommand } = this.AWS;

        const result = await this.s3Client.send(new GetObjectCommand(this.getObjectParams(identifier)));
        return result.Body as Readable | undefined;
    }

    private async writeFile(fileName: string, data: PutObjectRequest['Body'] | string | Uint8Array | Buffer) {
        const { Upload } = this.libStorage;

        const upload = new Upload({
            client: this.s3Client,
            params: {
                ...this.spacesConfig.nativeS3UploadConfiguration,
                Bucket: this.spacesConfig.bucket,
                Key: fileName,
                Body: data,
                ACL: 'private', // Default to private ACL
            },
        });

        return upload.done().then((result: any) => {
            if (!('Key' in result) || !result.Key) {
                Logger.error(`Got undefined Key for ${fileName}`, loggerCtx);
                throw new Error(`Got undefined Key for ${fileName}`);
            }

            return result.Key;
        });
    }

    async deleteFile(identifier: string) {
        const { DeleteObjectCommand } = this.AWS;
        await this.s3Client.send(new DeleteObjectCommand(this.getObjectParams(identifier)));
    }

    async fileExists(fileName: string) {
        const { HeadObjectCommand } = this.AWS;

        try {
            await this.s3Client.send(new HeadObjectCommand(this.getObjectParams(fileName)));
            return true;
        } catch (err: any) {
            return false;
        }
    }

    private getObjectParams(identifier: string) {
        return {
            Bucket: this.spacesConfig.bucket,
            Key: path.join(identifier.replace(/^\//, '')),
        };
    }

    private async ensureBucket(bucket = this.spacesConfig.bucket) {
        const { HeadBucketCommand, CreateBucketCommand } = this.AWS;

        try {
            await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
            Logger.verbose(`Found DigitalOcean Spaces bucket "${bucket}"`, loggerCtx);
            return;
        } catch (err: any) {
            Logger.verbose(
                `Could not find bucket "${bucket}": ${JSON.stringify(err.message)}. Attempting to create...`,
                loggerCtx,
            );
        }

        try {
            await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket, ACL: 'private' }));
            Logger.verbose(`Created DigitalOcean Spaces bucket "${bucket}"`, loggerCtx);
        } catch (err: any) {
            Logger.error(
                `Could not find nor create the DigitalOcean Spaces bucket "${bucket}": ${JSON.stringify(err.message)}"`,
                loggerCtx,
                err.stack,
            );
        }
    }

    private async getCredentials() {
        if (this.spacesConfig.credentials == null) {
            return undefined;
        }

        return this.spacesConfig.credentials;
    }
}