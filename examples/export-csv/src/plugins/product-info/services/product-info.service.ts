import { Injectable } from '@nestjs/common';
import {
  RequestContext,
  Logger,
  ChannelService,
  ProductVariantService,
  ProductService,
  StockLevelService,
} from '@vendure/core';
import * as fs from 'fs';
import * as path from 'path';

export interface VariantData {
  productId: string;
  productName: string;
  productEnabled: boolean;
  variantId: string;
  variantName: string;
  variantEnabled: boolean;
  sku: string;
  stockLevel: number;
}

@Injectable()
export class ProductInfoService {
  constructor(
    private channelService: ChannelService,
    private productVariantService: ProductVariantService,
    private productService: ProductService,
    private stockLevelService: StockLevelService
  ) {}

  async exportLowStockVariantsToCsv(ctx: RequestContext): Promise<string> {
    Logger.info('Starting export of variants with stock level < 100');
    const csvData: VariantData[] = [];
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const { items: variants, totalItems } = await this.productVariantService.findAll(ctx, {
        take: batchSize,
        skip,
        filter: { enabled: { eq: true } },
      });

      for (const variant of variants) {
        try {
          // Get actual stock level using StockLevelService
          const availableStock = await this.stockLevelService.getAvailableStock(ctx, variant.id);
          const stockLevel =
            typeof availableStock === 'number'
              ? availableStock
              : (availableStock as any)?.stockOnHand || 0;

          if (stockLevel < 100) {
            const defaultLanguageCode = await this.getDefaultLanguageCode(ctx);
            const variantProductId = (variant as any).productId;

            // Try to fetch product details
            let productName = 'Unknown Product';
            let productId = 'unknown';
            let productEnabled = false;

            if (variantProductId) {
              try {
                const product = await this.productService.findOne(ctx, variantProductId);
                if (product) {
                  productName = product.name;
                  productId = product.id.toString();
                  productEnabled = product.enabled;
                }
              } catch (productError) {
                Logger.warn(
                  `Failed to fetch product ${variantProductId} for variant ${variant.id}`
                );
              }
            }

            csvData.push({
              productId,
              productName,
              productEnabled,
              variantId: variant.id.toString(),
              variantName:
                variant.translations.find((t) => t.languageCode === defaultLanguageCode)?.name ||
                variant.name ||
                'Not Found',
              variantEnabled: variant.enabled,
              sku: variant.sku,
              stockLevel: stockLevel,
            });
          }
        } catch (error) {
          Logger.error(`Error processing variant ${variant.id}: ${(error as Error).message}`);
        }
      }

      skip += batchSize;
      hasMore = skip < totalItems;
    }

    const csvHeader =
      'Product ID,Product Name,Product Enabled,Variant ID,Variant Name,Variant Enabled,SKU,Stock Level\n';
    const csvRows = csvData
      .map(
        (row: VariantData) =>
          `${row.productId},"${row.productName}",${row.productEnabled},${row.variantId},"${row.variantName}",${row.variantEnabled},"${row.sku}",${row.stockLevel}`
      )
      .join('\n');

    const csvContent = csvHeader + csvRows;
    const fileDir = path.join(process.cwd(), 'exports');
    const filePath = path.join(fileDir, 'low-stock-variants.csv');

    if (!fs.existsSync(fileDir)) {
      try {
        fs.mkdirSync(fileDir);
      } catch (error) {
        Logger.error(`Failed to create directory for CSV export: ${error}`);
      }
    }

    fs.writeFileSync(filePath, csvContent);

    Logger.info(`CSV export completed: ${filePath}`);
    Logger.info(`Exported ${csvData.length} variants with stock level < 100`);

    return filePath;
  }

  private async getDefaultLanguageCode(ctx: RequestContext) {
    const channel = await this.channelService.getDefaultChannel(ctx);
    return channel.defaultLanguageCode;
  }
}
