import { VendureConfig, DefaultLogger, LogLevel, dummyPaymentHandler } from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';

export const config: VendureConfig = {
  apiOptions: {
    port: 3000,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    cors: {
      origin: true,
      credentials: true,
    },
  },
  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    superadminCredentials: {
      identifier: 'superadmin',
      password: 'superadmin',
    },
    cookieOptions: {
      secret: 'cookie-secret',
    },
  },
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: true,
    logging: false,
    database: path.join(__dirname, '../vendure.sqlite'),
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  customFields: {},
  plugins: [
    AdminUiPlugin.init({
      route: 'admin',
      port: 3002,
    }),
    EmailPlugin.init({
      devMode: true,
      outputPath: path.join(__dirname, '../static/email/test-emails'),
      route: 'mailbox',
      handlers: defaultEmailHandlers,
      templatePath: path.join(__dirname, '../static/email/templates'),
      globalTemplateVars: {
        fromAddress: '"Example Shop" <noreply@example.com>',
        verifyEmailAddressUrl: 'http://localhost:4200/verify',
        passwordResetUrl: 'http://localhost:4200/reset-password',
        changeEmailAddressUrl: 'http://localhost:4200/verify-email-address-change',
      },
    }),
  ],
  logger: new DefaultLogger({ level: LogLevel.Debug }),
};

export async function bootstrap(customConfig?: Partial<VendureConfig>) {
  const { bootstrap } = await import('@vendure/core');
  
  const finalConfig = {
    ...config,
    ...customConfig,
  };

  return bootstrap(finalConfig);
}

if (require.main === module) {
  bootstrap().then(app => {
    console.log('Main Vendure store is running on port 3000');
    console.log('Admin UI available at: http://localhost:3002/admin');
  }).catch(console.error);
}