import {mergeConfig} from '@vendure/core';
import {getBaseConfig} from '@shared/config';
import "dotenv/config";
import {ShopGithubAuthPlugin} from "./plugins/shop-github-auth/shop-github-auth.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(
  baseConfig,
  {
    plugins: [
      ...(baseConfig.plugins ?? []),
      ShopGithubAuthPlugin.init({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ],
  }
);
