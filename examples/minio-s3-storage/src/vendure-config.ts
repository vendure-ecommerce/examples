import {
  dummyPaymentHandler,
  DefaultJobQueuePlugin,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from "@vendure/core";
import {
  defaultEmailHandlers,
  EmailPlugin,
  FileBasedTemplateLoader,
} from "@vendure/email-plugin";
import { AssetServerPlugin, configureS3AssetStorage } from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import { GraphiqlPlugin } from "@vendure/graphiql-plugin";
import "dotenv/config";
import path from "path";

const IS_DEV = process.env.APP_ENV === "dev";
const serverPort = +(process.env.PORT || 3000);

export const config: VendureConfig = {
  apiOptions: {
    port: serverPort,
    adminApiPath: "admin-api",
    shopApiPath: "shop-api",
    trustProxy: IS_DEV ? false : 1,
    // The following options are useful in development mode,
    // but are best turned off for production for security
    // reasons.
    ...(IS_DEV
      ? {
          adminApiDebug: true,
          shopApiDebug: true,
        }
      : {}),
  },
  authOptions: {
    tokenMethod: ["bearer", "cookie"],
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME || "superadmin",
      password: process.env.SUPERADMIN_PASSWORD || "superadmin",
    },
    cookieOptions: {
      secret: process.env.COOKIE_SECRET || "cookie-secret-minio-s3-storage",
    },
  },
  dbConnectionOptions: {
    type: "better-sqlite3",
    // See the README.md "Migrations" section for an explanation of
    // the `synchronize` and `migrations` options.
    synchronize: false,
    migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
    logging: false,
    database: path.join(__dirname, "../minio-s3-storage.sqlite"),
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  // When adding or altering custom field definitions, the database will
  // need to be updated. See the "Migrations" section in README.md.
  customFields: {},
  plugins: [
    GraphiqlPlugin.init(),
    AssetServerPlugin.init({
      route: "assets",
      assetUploadDir: path.join(__dirname, "../static/assets"),
      // MinIO S3-compatible storage strategy
      storageStrategyFactory: process.env.MINIO_ENDPOINT
        ? configureS3AssetStorage({
            bucket: process.env.MINIO_BUCKET || "vendure-assets",
            credentials: {
              accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
              secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
            },
            nativeS3Configuration: {
              endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
              forcePathStyle: true,
              signatureVersion: "v4",
              // Required by AWS SDK even when using MinIO
              region: process.env.MINIO_REGION || "us-east-1",
            },
          })
        : undefined, // Falls back to local storage when MinIO is not configured
      // Dynamic asset URL prefix based on MinIO configuration
      assetUrlPrefix: process.env.MINIO_ENDPOINT
        ? `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET || "vendure-assets"}/`
        : IS_DEV
          ? undefined
          : "https://www.my-shop.com/assets/",
    }),
    DefaultSchedulerPlugin.init(),
    DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
    DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
    EmailPlugin.init({
      devMode: true,
      outputPath: path.join(__dirname, "../static/email/test-emails"),
      route: "mailbox",
      handlers: defaultEmailHandlers,
      templateLoader: new FileBasedTemplateLoader(
        path.join(__dirname, "../static/email/templates"),
      ),
      globalTemplateVars: {
        // The following variables will change depending on your storefront implementation.
        // Here we are assuming a storefront running at http://localhost:8080.
        fromAddress: '"example" <noreply@example.com>',
        verifyEmailAddressUrl: "http://localhost:8080/verify",
        passwordResetUrl: "http://localhost:8080/password-reset",
        changeEmailAddressUrl:
          "http://localhost:8080/verify-email-address-change",
      },
    }),
    AdminUiPlugin.init({
      route: "admin",
      port: serverPort + 2,
      adminUiConfig: {
        apiPort: serverPort,
      },
    }),
  ],
};
