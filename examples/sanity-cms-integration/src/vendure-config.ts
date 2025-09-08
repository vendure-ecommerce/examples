import { mergeConfig } from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import "dotenv/config";
import { CmsPlugin } from "./plugins/cms/cms.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    CmsPlugin.init({
      sanityApiKey: process.env.SANITY_API_KEY,
      sanityProjectId: process.env.SANITY_PROJECT_ID,
      sanityDataset: process.env.SANITY_DATASET || "production",
      sanityOrigin: process.env.SANITY_ORIGIN,
    }),

    // Add your custom plugins here
  ],
  // Add any other overrides here
});
