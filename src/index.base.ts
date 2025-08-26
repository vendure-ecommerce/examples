import { bootstrap } from '@vendure/core';
import { VendureConfig } from '@vendure/core';

export async function runServer(config: VendureConfig) {
  const app = await bootstrap(config);
  return app;
}