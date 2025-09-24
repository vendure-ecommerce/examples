import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';
import "dotenv/config";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  dbConnectionOptions: {
    type: "sqlite",
    database: process.env.DB_NAME || "vendure",
    logging: process.env.DB_LOGGING === "true",
    synchronize: true,
  },
  plugins: [
    ...(baseConfig.plugins ?? []),
    // Add your custom plugins here
  ],
  // Add any other overrides here
});
