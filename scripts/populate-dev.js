const { bootstrap, JobQueueService, mergeConfig, UserService, RequestContext } = require('@vendure/core');
const { populate } = require('@vendure/core/cli');
const path = require('path');

// Simple base config instead of importing TypeScript
function createBaseConfig() {
    const IS_DEV = process.env.NODE_ENV !== 'production';
    
    return {
        apiOptions: {
            port: +(process.env.PORT || 3001),
            adminApiPath: "admin-api",
            shopApiPath: "shop-api",
            ...(IS_DEV && {
                adminApiDebug: true,
                shopApiDebug: true,
            }),
        },
        authOptions: {
            tokenMethod: ["bearer", "cookie"],
            superadminCredentials: {
                identifier: process.env.SUPERADMIN_USERNAME || "superadmin",
                password: process.env.SUPERADMIN_PASSWORD || "superadmin",
            },
        },
        dbConnectionOptions: {
            type: "postgres",
            host: process.env.DB_HOST || "localhost",
            port: +(process.env.DB_PORT || 5432),
            username: process.env.DB_USER || "vendure",
            password: process.env.DB_PASSWORD || "vendure",
            database: process.env.DB_NAME || "vendure",
            synchronize: true,
            logging: process.env.DB_LOGGING === 'true',
        },
        paymentOptions: {
            paymentMethodHandlers: [require('@vendure/core').dummyPaymentHandler],
        },
        plugins: [
            require('@vendure/graphiql-plugin').GraphiqlPlugin.init(),
            require('@vendure/core').DefaultSchedulerPlugin.init({}),
            require('@vendure/job-queue-plugin/package/bullmq').BullMQJobQueuePlugin.init({
                connection: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: +(process.env.REDIS_PORT || 6379),
                    maxRetriesPerRequest: null
                },
            }),
            require('@vendure/core').DefaultSearchPlugin.init({bufferUpdates: false}),
            // DashboardPlugin removed to avoid TypeScript import issues
            require('@vendure/email-plugin').EmailPlugin.init({
                devMode: true,
                outputPath: path.join(__dirname, "../static/email/test-emails"),
                route: "mailbox",
                handlers: require('@vendure/email-plugin').defaultEmailHandlers,
                templateLoader: new (require('@vendure/email-plugin').FileBasedTemplateLoader)(
                    path.join(__dirname, "../static/email/templates"),
                ),
                globalTemplateVars: {
                    fromAddress: '"example" <noreply@example.com>',
                    verifyEmailAddressUrl: "http://localhost:8080/verify",
                    passwordResetUrl: "http://localhost:8080/password-reset",
                    changeEmailAddressUrl: "http://localhost:8080/verify-email-address-change",
                },
            }),
        ],
    };
}

// Import initial data - we'll use a minimal version for this script
const initialData = {
    defaultLanguage: 'en',
    defaultZone: 'Europe',
    countries: [
        { name: 'Austria', code: 'AT', zone: 'Europe' },
        { name: 'Belgium', code: 'BE', zone: 'Europe' },
        { name: 'Bulgaria', code: 'BG', zone: 'Europe' },
        { name: 'Croatia', code: 'HR', zone: 'Europe' },
        { name: 'Cyprus', code: 'CY', zone: 'Europe' },
        { name: 'Czech Republic', code: 'CZ', zone: 'Europe' },
        { name: 'Denmark', code: 'DK', zone: 'Europe' },
        { name: 'Estonia', code: 'EE', zone: 'Europe' },
        { name: 'Finland', code: 'FI', zone: 'Europe' },
        { name: 'France', code: 'FR', zone: 'Europe' },
        { name: 'Germany', code: 'DE', zone: 'Europe' },
        { name: 'Greece', code: 'GR', zone: 'Europe' },
        { name: 'Hungary', code: 'HU', zone: 'Europe' },
        { name: 'Ireland', code: 'IE', zone: 'Europe' },
        { name: 'Italy', code: 'IT', zone: 'Europe' },
        { name: 'Latvia', code: 'LV', zone: 'Europe' },
        { name: 'Lithuania', code: 'LT', zone: 'Europe' },
        { name: 'Luxembourg', code: 'LU', zone: 'Europe' },
        { name: 'Malta', code: 'MT', zone: 'Europe' },
        { name: 'Netherlands', code: 'NL', zone: 'Europe' },
        { name: 'Poland', code: 'PL', zone: 'Europe' },
        { name: 'Portugal', code: 'PT', zone: 'Europe' },
        { name: 'Romania', code: 'RO', zone: 'Europe' },
        { name: 'Slovakia', code: 'SK', zone: 'Europe' },
        { name: 'Slovenia', code: 'SI', zone: 'Europe' },
        { name: 'Spain', code: 'ES', zone: 'Europe' },
        { name: 'Sweden', code: 'SE', zone: 'Europe' },
        { name: 'United Kingdom', code: 'GB', zone: 'Europe' },
        { name: 'United States of America', code: 'US', zone: 'Americas' },
        { name: 'Canada', code: 'CA', zone: 'Americas' },
        { name: 'Mexico', code: 'MX', zone: 'Americas' },
        { name: 'Australia', code: 'AU', zone: 'Oceania' },
        { name: 'New Zealand', code: 'NZ', zone: 'Oceania' },
        { name: 'South Africa', code: 'ZA', zone: 'Africa' },
        { name: 'Brazil', code: 'BR', zone: 'Americas' },
        { name: 'Argentina', code: 'AR', zone: 'Americas' },
        { name: 'India', code: 'IN', zone: 'Asia' },
        { name: 'China', code: 'CN', zone: 'Asia' },
        { name: 'Japan', code: 'JP', zone: 'Asia' },
        { name: 'Singapore', code: 'SG', zone: 'Asia' },
    ],
    taxRates: [
        { name: 'Standard Tax', percentage: 20 },
        { name: 'Reduced Tax', percentage: 10 },
        { name: 'Zero Tax', percentage: 0 },
    ],
    shippingMethods: [
        { name: 'Standard Shipping', price: 500 },
        { name: 'Express Shipping', price: 1000 },
    ],
    paymentMethods: [
        {
            name: 'Standard Payment',
            handler: { code: 'dummy-payment-handler', arguments: [] },
        },
    ],
    collections: [
        {
            name: 'Electronics',
            filters: [
                { code: 'facet-value-filter', arguments: { facetValueNames: ['Electronics'], containsAny: false } },
            ],
        },
        {
            name: 'Computers',
            filters: [
                { code: 'facet-value-filter', arguments: { facetValueNames: ['Computers'], containsAny: false } },
            ],
        },
        {
            name: 'Sports & Outdoor',
            filters: [
                { code: 'facet-value-filter', arguments: { facetValueNames: ['Sports & Outdoor'], containsAny: false } },
            ],
        },
        {
            name: 'Home & Garden',
            filters: [
                { code: 'facet-value-filter', arguments: { facetValueNames: ['Home & Garden'], containsAny: false } },
            ],
        },
    ],
};

/**
 * Creates test users for development purposes
 */
async function createTestUsers(app) {
    const userService = app.get(UserService);
    const ctx = RequestContext.empty();

    const testUsers = [
        'john@example.com',
        'jane@example.com',
        'alice@example.com',
        'bob@example.com',
        'charlie@example.com',
        'diana@example.com',
        'edward@example.com',
        'fiona@example.com',
        'george@example.com',
        'helen@example.com'
    ];

    console.log('Creating test users...');

    for (const email of testUsers) {
        try {
            const user = await userService.createCustomerUser(ctx, email, 'test');
            console.log(`Created user: ${email}`);
        } catch (error) {
            console.log(`Failed to create user ${email}:`, error.message);
        }
    }

    console.log('Test users creation completed');
}

/* eslint-disable no-console */

/**
 * A CLI script which populates the dev database with deterministic random data.
 */
if (require.main === module) {
    // Running from command line
    const populateConfig = mergeConfig(
        createBaseConfig(),
        {
            authOptions: {
                tokenMethod: 'bearer',
                requireVerification: false,
            },
            importExportOptions: {
                importAssetsDir: path.join(__dirname, 'assets'),
            },
            customFields: {},
        },
    );
    
    console.log('Starting database population...');
    console.log('Config database:', populateConfig.dbConnectionOptions);
    
    populate(
            () =>
                bootstrap(populateConfig).then(async app => {
                    await app.get(JobQueueService).start();
                    console.log('Vendure app bootstrapped and job queue started');
                    return app;
                }),
            initialData,
            path.join(__dirname, 'assets/products.csv'),
        )
        .then(async app => {
            console.log('Population complete! Creating test users...');
            await createTestUsers(app);
            console.log('All setup complete! Closing app...');
            return app.close();
        })
        .then(
            () => {
                console.log('Database population completed successfully!');
                process.exit(0);
            },
            err => {
                console.log('Error during population:', err);
                process.exit(1);
            },
        );
}