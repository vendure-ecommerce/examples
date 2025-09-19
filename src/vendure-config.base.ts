import {
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  dummyPaymentHandler,
  mergeConfig,
  VendureConfig,
} from "@vendure/core";
import { BullMQJobQueuePlugin } from "@vendure/job-queue-plugin/package/bullmq";
import { DashboardPlugin } from "@vendure/dashboard/plugin";
import path from "path";
import { GraphiqlPlugin } from "@vendure/graphiql-plugin";
import {
  defaultEmailHandlers,
  EmailPlugin,
  FileBasedTemplateLoader,
} from "@vendure/email-plugin";

export const getBaseConfig = (): VendureConfig => {
  const IS_DEV = process.env.NODE_ENV !== "production";

  return {
    apiOptions: {
      port: +(process.env.PORT || 3000),
      adminApiPath: "admin-api",
      shopApiPath: "shop-api",
      ...(IS_DEV && {
        adminApiDebug: true,
        shopApiDebug: true,
      }),
    },
    authOptions: {
      tokenMethod: ["bearer", "cookie"],
      superadminCredentials: {
        identifier: process.env.SUPERADMIN_USERNAME || "superadmin",
        password: process.env.SUPERADMIN_PASSWORD || "superadmin",
      },
    },
    dbConnectionOptions: {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || "vendure",
      password: process.env.DB_PASSWORD || "vendure",
      database: process.env.DB_NAME || "vendure",
      synchronize: true, // Auto-sync schema in development
      logging: process.env.DB_LOGGING === "true",
    },
    paymentOptions: {
      paymentMethodHandlers: [dummyPaymentHandler],
    },
    plugins: [
      GraphiqlPlugin.init(),
      DefaultSchedulerPlugin.init({}),
      BullMQJobQueuePlugin.init({
        connection: {
          host: process.env.REDIS_HOST || "localhost",
          port: +(process.env.REDIS_PORT || 6379),
          maxRetriesPerRequest: null,
        },
      }),
      DefaultSearchPlugin.init({ bufferUpdates: false }),
      DashboardPlugin.init({
        route: "dashboard",
        appDir: path.join(__dirname, "../shared/dashboard/dist"),
      }),
      EmailPlugin.init({
        devMode: true,
        outputPath: path.join(__dirname, "../static/email/test-emails"),
        route: "mailbox",
        handlers: defaultEmailHandlers,
        templateLoader: new FileBasedTemplateLoader(
          path.join(__dirname, "../static/email/templates"),
        ),
        globalTemplateVars: {
          fromAddress: '"example" <noreply@example.com>',
          verifyEmailAddressUrl: "http://localhost:8080/verify",
          passwordResetUrl: "http://localhost:8080/password-reset",
          changeEmailAddressUrl:
            "http://localhost:8080/verify-email-address-change",
        },
      }),
    ],
  };
};

export const createBaseConfig = (
  overrides: Partial<VendureConfig> = {},
): VendureConfig => {
  return mergeConfig(getBaseConfig(), overrides);
};

