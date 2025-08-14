import { bootstrapWorker } from '@vendure/core';
import { config } from './vendure-config';
import { VendureConfig } from '@vendure/core';
import path from 'path';

const exampleConfig: VendureConfig = {
  ...config,
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: true,
    logging: false,
    database: path.join(__dirname, '../shop-github-auth.sqlite'),
  },
};

bootstrapWorker(exampleConfig)
    .then(worker => worker.startJobQueue())
    .catch(err => {
        console.log(err);
    });