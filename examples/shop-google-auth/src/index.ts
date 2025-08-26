import { runServer } from '@shared/server';
import { config } from './vendure-config';

runServer(config)
  .then(() => console.log('Server started: shop-google-auth'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });