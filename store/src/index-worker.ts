import { bootstrapWorker } from '@vendure/core';
import { config } from './vendure-config';

// Export worker bootstrap for templates
export { bootstrapWorker } from '@vendure/core';
export { config } from './vendure-config';

bootstrapWorker(config)
    .then(worker => worker.startJobQueue())
    .catch(err => {
        console.log(err);
    });