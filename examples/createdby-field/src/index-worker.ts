
import { runWorker } from '@shared/worker';
import { config } from './vendure-config';

runWorker(config)
  .then(() => console.log('Worker started: createdby-field'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
