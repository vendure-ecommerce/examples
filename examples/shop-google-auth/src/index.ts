import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import { VendureConfig } from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';

const exampleConfig: VendureConfig = {
  ...config,
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: false,
    migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
    logging: false,
    database: path.join(__dirname, '../shop-google-auth.sqlite'),
  },
  plugins: [
    ...(config.plugins || []).map((plugin: any) => {
      if (plugin.constructor.name === 'AdminUiPlugin') {
        return AdminUiPlugin.init({
          route: 'admin',
          port: 3002,
          adminUiConfig: {
            apiPort: 3000,
          },
        });
      }
      return plugin;
    }),
  ],
};

runMigrations(exampleConfig)
    .then(() => bootstrap(exampleConfig))
    .catch(err => {
        console.log(err);
    });