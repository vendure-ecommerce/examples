
import { runServer } from '@shared/server';
import { config } from './vendure-config';

runServer(config)
  .then(() => console.log('Server started: export-csv'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
