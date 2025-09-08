import { bootstrapWorker, Logger, RequestContextService } from '@vendure/core';

import { config } from '../vendure-config';
import { ProductInfoService } from '../plugins/product-info/services/product-info.service';

if (require.main === module) {
  exportLowStockVariants()
    .then(() => process.exit(0))
    .catch((err) => {
      Logger.error(err);
      process.exit(1);
    });
}

async function exportLowStockVariants() {
  // Bootstrap Vendure Worker to access services without API overhead
  const { app } = await bootstrapWorker(config);

  // Get the ProductInfoService from our plugin
  const productInfoService = app.get(ProductInfoService);

  // Create a RequestContext for service operations
  const ctx = await app.get(RequestContextService).create({
    apiType: 'admin',
  });

  // Export variants with stock level < 100 to CSV
  const csvFilePath = await productInfoService.exportLowStockVariantsToCsv(ctx);

  Logger.info(`Low stock variants export complete! File saved at: ${csvFilePath}`);
}
