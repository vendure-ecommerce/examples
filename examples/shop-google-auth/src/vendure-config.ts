import {mergeConfig} from '@vendure/core';
import {getBaseConfig} from '@shared/config';
import "dotenv/config";
import {ShopGoogleAuthPlugin} from "./plugins/shop-google-auth/shop-google-auth.plugin";

const baseConfig = getBaseConfig();

export const config = mergeConfig(
    baseConfig,
    {
        plugins: [
            ...(baseConfig.plugins ?? []),
            ShopGoogleAuthPlugin.init({
                googleClientId: process.env.GOOGLE_CLIENT_ID,
            }),
        ],
    }
);
