
import { runServer } from '@shared/server';
import { config } from './vendure-config';

runServer(config)
  .then(() => console.log('Server started: cms-integration-plugin'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
