import { mergeConfig } from "@vendure/core";
import { getBaseConfig } from "@shared/config";
import "dotenv/config";
import { ProductInfoPlugin } from "./plugins/product-info/product-info.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    // Add your custom plugins here
    ProductInfoPlugin.init({}),
  ],
  // Add any other overrides here
});
