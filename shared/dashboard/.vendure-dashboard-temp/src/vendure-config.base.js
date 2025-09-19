"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseConfig = exports.getBaseConfig = void 0;
const core_1 = require("@vendure/core");
const bullmq_1 = require("@vendure/job-queue-plugin/package/bullmq");
const plugin_1 = require("@vendure/dashboard/plugin");
const path_1 = __importDefault(require("path"));
const graphiql_plugin_1 = require("@vendure/graphiql-plugin");
const email_plugin_1 = require("@vendure/email-plugin");
const getBaseConfig = () => {
    const IS_DEV = process.env.NODE_ENV !== "production";
    return {
        apiOptions: {
            port: +(process.env.PORT || 3000),
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
            synchronize: true, // Auto-sync schema in development
            logging: process.env.DB_LOGGING === "true",
        },
        paymentOptions: {
            paymentMethodHandlers: [core_1.dummyPaymentHandler],
        },
        plugins: [
            graphiql_plugin_1.GraphiqlPlugin.init(),
            core_1.DefaultSchedulerPlugin.init({}),
            bullmq_1.BullMQJobQueuePlugin.init({
                connection: {
                    host: process.env.REDIS_HOST || "localhost",
                    port: +(process.env.REDIS_PORT || 6379),
                    maxRetriesPerRequest: null,
                },
            }),
            core_1.DefaultSearchPlugin.init({ bufferUpdates: false }),
            plugin_1.DashboardPlugin.init({
                route: "dashboard",
                appDir: path_1.default.join(__dirname, "../shared/dashboard/dist"),
            }),
            email_plugin_1.EmailPlugin.init({
                devMode: true,
                outputPath: path_1.default.join(__dirname, "../static/email/test-emails"),
                route: "mailbox",
                handlers: email_plugin_1.defaultEmailHandlers,
                templateLoader: new email_plugin_1.FileBasedTemplateLoader(path_1.default.join(__dirname, "../static/email/templates")),
                globalTemplateVars: {
                    fromAddress: '"example" <noreply@example.com>',
                    verifyEmailAddressUrl: "http://localhost:8080/verify",
                    passwordResetUrl: "http://localhost:8080/password-reset",
                    changeEmailAddressUrl: "http://localhost:8080/verify-email-address-change",
                },
            }),
        ],
    };
};
exports.getBaseConfig = getBaseConfig;
const createBaseConfig = (overrides = {}) => {
    return (0, core_1.mergeConfig)((0, exports.getBaseConfig)(), overrides);
};
exports.createBaseConfig = createBaseConfig;
