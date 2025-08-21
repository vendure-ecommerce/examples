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
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import { GraphiqlPlugin } from "@vendure/graphiql-plugin";
import { 
  configureCloudFlareR2Storage, 
  createR2StorageFactory 
} from "./plugins/cloudflare-r2-storage/index.js";
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
      secret: process.env.COOKIE_SECRET || "cookie-secret-cloudflare-r2-storage",
    },
  },
  dbConnectionOptions: {
    type: "better-sqlite3",
    // See the README.md "Migrations" section for an explanation of
    // the `synchronize` and `migrations` options.
    synchronize: false,
    migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
    logging: false,
    database: path.join(__dirname, "../vendure.sqlite"),
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
      // For local dev, the correct value for assetUrlPrefix should
      // be guessed correctly, but for production it will usually need
      // to be set manually to match your production url.
      assetUrlPrefix: IS_DEV ? undefined : "https://www.my-shop.com/assets/",
      // CloudFlare R2 storage strategy configuration
      // When R2 environment variables are configured, use R2 storage
      // Otherwise fallback to local file storage for development
      storageStrategyFactory: process.env.CLOUDFLARE_ACCOUNT_ID 
        ? createR2StorageFactory({
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            bucket: process.env.CLOUDFLARE_R2_BUCKET || 'vendure-assets',
            customDomain: process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN,
            region: process.env.CLOUDFLARE_R2_REGION || 'auto',
            useHttps: process.env.CLOUDFLARE_R2_USE_HTTPS !== 'false',
          })
        : undefined, // Use default local storage when R2 not configured
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
