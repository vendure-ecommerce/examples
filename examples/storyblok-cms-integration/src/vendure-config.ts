import { mergeConfig } from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import "dotenv/config";
import { CmsPlugin } from "./plugins/cms/cms.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    CmsPlugin.init({
      cmsApiKey: process.env.STORYBLOK_API_KEY,
      storyblokSpaceId: process.env.STORYBLOK_SPACE_ID,
    }),
  ],
  // Add any other overrides here
});
