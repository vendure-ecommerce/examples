import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';
import "dotenv/config";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    // Add your custom plugins here
  ],
  // Add any other overrides here
});
