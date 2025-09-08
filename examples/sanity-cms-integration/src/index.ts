
import { runServer } from '@shared/server';
import { config } from './vendure-config';

runServer(config)
  .then(() => console.log('Server started: sanity-cms-integration'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
