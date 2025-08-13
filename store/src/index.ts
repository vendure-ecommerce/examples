import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';

// Export the config and core functions for templates
export { config } from './vendure-config';
export { bootstrap, bootstrapWorker, runMigrations } from '@vendure/core';

// Re-export commonly used Vendure types and utilities for templates
export {
    VendureConfig,
    DefaultLogger,
    LogLevel,
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
} from '@vendure/core';
export { EmailPlugin, defaultEmailHandlers, FileBasedTemplateLoader } from '@vendure/email-plugin';
export { AdminUiPlugin } from '@vendure/admin-ui-plugin';
export { AssetServerPlugin } from '@vendure/asset-server-plugin';
export { GraphiqlPlugin } from '@vendure/graphiql-plugin';

runMigrations(config)
    .then(() => bootstrap(config))
    .catch(err => {
        console.log(err);
    });