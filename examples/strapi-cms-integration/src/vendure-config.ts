import { mergeConfig } from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import "dotenv/config";
import { CmsPlugin } from "./plugins/cms/cms.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    CmsPlugin.init({
      cmsApiKey: process.env.STRAPI_API_KEY, // Strapi API key for authentication
      strapiBaseUrl: process.env.STRAPI_BASE_URL || "http://localhost:1337",
    }),

    // Add your custom plugins here
  ],
  // Add any other overrides here
});
