import {mergeConfig, VendureConfig} from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import "dotenv/config";
import { CmsPlugin } from "./plugins/cms/cms.plugin";

const baseConfig = getBaseConfig();

export const config: VendureConfig = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    // Add your custom plugins here
    CmsPlugin.init({
      cmsApiKey: process.env.PAYLOAD_API_KEY, // Optional: for authentication if needed
    }),
  ],
  // Add any other overrides here
});
