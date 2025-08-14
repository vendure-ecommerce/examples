import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core'

import { SHOP_GITHUB_AUTH_PLUGIN_OPTIONS } from './constants'
import { GithubAuthStrategy } from './github-auth-strategy'
import { PluginInitOptions } from './types'

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: SHOP_GITHUB_AUTH_PLUGIN_OPTIONS, useFactory: () => ShopGithubAuthPlugin.options },
  ],
  configuration: (config) => {
    const options = ShopGithubAuthPlugin.options

    if (options.clientId && options.clientSecret) {
      config.authOptions.shopAuthenticationStrategy.push(new GithubAuthStrategy(options))
    }
    return config
  },
  compatibility: '^3.0.0',
})
export class ShopGithubAuthPlugin {
  static options: PluginInitOptions

  static init(options: PluginInitOptions): Type<ShopGithubAuthPlugin> {
    this.options = options
    return ShopGithubAuthPlugin
  }
}
