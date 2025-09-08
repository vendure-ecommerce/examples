import { mergeConfig } from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import {
  AssetServerPlugin,
  configureS3AssetStorage,
} from "@vendure/asset-server-plugin";
import "dotenv/config";
import path from "path";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    AssetServerPlugin.init({
      route: "assets",
      assetUploadDir: path.join(__dirname, "../static/assets"),
      // S3-Compatible Storage Configuration
      // When S3_BUCKET is configured, use S3-compatible storage instead of local files
      // Supports AWS S3, Digital Ocean Spaces, MinIO, CloudFlare R2, and other S3-compatible services
      storageStrategyFactory: process.env.S3_BUCKET
        ? configureS3AssetStorage({
            bucket: process.env.S3_BUCKET,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID!,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
            nativeS3Configuration: {
              endpoint: process.env.S3_ENDPOINT,
              region: process.env.S3_REGION,
              forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
              signatureVersion: "v4",
            },
          })
        : undefined,
    }),
  ],
});
