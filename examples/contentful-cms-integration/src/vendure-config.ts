import { mergeConfig } from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import "dotenv/config";
import { CmsPlugin } from "./plugins/cms/cms.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    // Add your custom plugins here
    CmsPlugin.init({
      cmsApiKey: process.env.CONTENTFUL_API_KEY,
      contentfulSpaceId: process.env.CONTENTFUL_SPACE_ID,
    }),
  ],
  // Add any other overrides here
});
