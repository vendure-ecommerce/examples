import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core'

import { SHOP_GOOGLE_AUTH_PLUGIN_OPTIONS } from './constants'
import { GoogleAuthStrategy } from './google-auth-strategy'
import { PluginInitOptions } from './types'

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: SHOP_GOOGLE_AUTH_PLUGIN_OPTIONS, useFactory: () => ShopGoogleAuthPlugin.options },
  ],
  configuration: (config) => {
    const options = ShopGoogleAuthPlugin.options
    if (options.googleClientId) {
      config.authOptions.shopAuthenticationStrategy.push(new GoogleAuthStrategy(options))
    }
    return config
  },
  compatibility: '^3.0.0',
})
export class ShopGoogleAuthPlugin {
  static options: PluginInitOptions

  static init(options: PluginInitOptions): Type<ShopGoogleAuthPlugin> {
    this.options = options
    return ShopGoogleAuthPlugin
  }
}
