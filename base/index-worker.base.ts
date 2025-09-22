import { bootstrapWorker } from '@vendure/core';
import { VendureConfig } from '@vendure/core';

export async function runWorker(config: VendureConfig) {
  const worker = await bootstrapWorker(config);
  return worker;
}