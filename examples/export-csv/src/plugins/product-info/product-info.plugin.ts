import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { PRODUCT_INFO_PLUGIN_OPTIONS } from './constants';
import { PluginInitOptions } from './types';
import { ProductInfoService } from './services/product-info.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    {
      provide: PRODUCT_INFO_PLUGIN_OPTIONS,
      useFactory: () => ProductInfoPlugin.options,
    },
    ProductInfoService,
  ],
  configuration: (config) => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.
    return config;
  },
  compatibility: '^3.0.0',
})
export class ProductInfoPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<ProductInfoPlugin> {
    this.options = options;
    return ProductInfoPlugin;
  }
}
