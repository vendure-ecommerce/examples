# Create Vendure Example

Create a complete, working Vendure example for: $ARGUMENTS

This command will generate a lightweight, portable, and production-ready example implementation following Vendure best practices and TypeScript standards. The example will typically include a custom Vendure plugin for the requested integration. The implementation will be dynamically determined based on the request analysis.

## 1. Research and Analysis

### Understand the Request
- **Parse the example description**: "$ARGUMENTS"
- **Analyze what functionality is needed**: Break down the request to understand the core requirements
- **Determine Vendure integration points**: What Vendure APIs, strategies, or services need to be extended or integrated with?
- **Generate appropriate example name**: Convert description to kebab-case (e.g., "Microsoft OAuth SSO" → "microsoft-oauth-sso")

### Research Current Vendure Documentation
- **Fetch latest Vendure docs** using Context7 MCP server or https://docs.vendure.io/llms.txt
- **Focus research on relevant areas** based on the request analysis:
  - Core plugin architecture and patterns
  - Specific Vendure APIs mentioned or implied in the request
  - Integration patterns for external services
  - GraphQL schema extensions if needed
  - Database entities and custom fields if required
- **Study existing examples** in `examples/` directory for similar patterns and approaches

## 2. Dynamic Architecture Planning

### Analyze Required Components
Based on the request analysis, determine what components are needed for the example. Use these concrete patterns as reference (examples typically contain Vendure plugins):

**OAuth/Authentication Example Pattern:**
- Custom authentication strategy extending Vendure's `ExternalAuthenticationService`
- OAuth flow implementation with actual token exchange
- User profile mapping and account creation/linking
- Session management and authentication state
- *Must be fully functional: users can actually log in successfully*

**Payment Gateway Example Pattern:**
- Payment method handler implementing Vendure's payment interfaces
- Real payment processing with SDK integration
- Webhook endpoint handling for payment status updates
- Transaction state management and error handling
- *Must be fully functional: payments can actually be processed*

**Storage Integration Example Pattern:**
- Asset storage strategy implementing Vendure's storage interfaces `AssetServerPlugin`
- Use `S3AssetStorageStrategy` as reference implementation
- File upload/download operations with real cloud service APIs
- URL generation and asset serving
- Configuration for development vs production environments
- *Must be fully functional: files can actually be stored and retrieved*

### Define Example Architecture
Dynamically determine based on the request:
- **Configuration interface**: What settings and options should be configurable?
- **Environment variables**: What credentials, URLs, and runtime settings are needed?
- **Dependencies**: What external npm packages or SDKs are required?
- **Integration points**: Which Vendure interfaces need to be implemented?
- **Plugin structure**: What Vendure plugin(s) need to be created for this example?
- **Functional requirements**: What must actually work end-to-end for testing?

## 3. Implementation

### Generate Example Name and Structure
```bash
# Convert description to kebab-case example name
# Example: "Microsoft OAuth SSO integration" → "microsoft-oauth-sso"
EXAMPLE_NAME=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
```

### Copy Base Example Structure
- **Use existing create-example.js** as foundation for directory structure
- **Copy from `store/` directory** to create base project
- **Modify for example-specific database** (separate SQLite file)

### Create Complete Example Implementation

#### 1. Plugin Creation via CLI
Use Vendure CLI to create plugin structure for enhanced portability:
```bash
npx vendure add -p ${EXAMPLE_NAME}Plugin
```
The CLI automatically creates the plugin in `src/plugins/${EXAMPLE_NAME}/` with proper structure.

#### 2. Generate Fully Working Implementation
**CRITICAL**: The implementation must be **complete and functional**, not scaffolding. Use these patterns as reference:

**For OAuth/Authentication (Example: Microsoft OAuth):**
- Implement actual OAuth 2.0 flow with Microsoft Graph API
- Handle token exchange, user profile fetching, and account mapping
- Include proper error handling and security measures
- *Result: Users can actually sign in with Microsoft accounts*

**For Payment Gateways (Example: Stripe Integration):**
- Implement real Stripe payment processing with SDK
- Handle payment intents, webhooks, and status updates
- Include proper error handling and retry logic
- *Result: Payments can actually be processed through Stripe*

**For Storage Solutions (Example: AWS S3 Integration):**
- Implement actual S3 operations using AWS SDK
- Handle file uploads, downloads, and URL generation
- Include proper authentication and error handling
- *Result: Files can actually be stored and retrieved from S3*

#### 3. Core Plugin Structure
Generate TypeScript types, constants, and main plugin class:

```typescript
// types.ts - Dynamic based on integration
export interface PluginOptions {
  // Generated based on specific integration requirements
}

// constants.ts - Plugin metadata and injection tokens
export const PLUGIN_OPTIONS = 'PLUGIN_OPTIONS';

// main-plugin.plugin.ts - Complete implementation
@VendurePlugin({
  // Complete configuration including:
  // - Required providers and services
  // - Vendure integration points
  // - GraphQL extensions if needed
  // - Event subscribers if needed
})
export class MainPlugin {
  // Complete implementation with working functionality
}
```

#### 4. Integration Implementation Requirements
**Each plugin must include working code that:**
- **Connects to real external services** (not mock implementations)
- **Handles authentication and authorization** properly
- **Includes comprehensive error handling** and logging
- **Follows security best practices** (no hardcoded secrets, proper validation)
- **Is production-ready** with proper configuration management
- **Can be tested end-to-end** immediately after setup

### Update Project Configuration

#### 1. Package.json Dependencies
Add required dependencies based on integration:
```json
{
  "dependencies": {
    // OAuth integrations: passport, oauth libraries
    // Payment: stripe, paypal-sdk, etc.
    // Storage: @aws-sdk/*, google-cloud-storage, etc.
    // Email: @sendgrid/mail, nodemailer, etc.
  }
}
```

#### 2. Environment Configuration
Add environment variables with fallbacks:
```typescript
// In vendure-config.ts
const config: VendureConfig = {
  // Plugin environment variables with fallbacks
  plugins: [
    PluginName.init({
      apiKey: process.env.PLUGIN_API_KEY || 'development-key',
      webhookUrl: process.env.PLUGIN_WEBHOOK_URL,
      enabled: process.env.NODE_ENV === 'production',
    }),
  ],
};
```

#### 3. Database Configuration
- Separate SQLite database for the example
- Migration support if custom entities needed
- Proper TypeORM configuration

## 4. Documentation Creation

### Comprehensive README.md
Create detailed documentation including:

```markdown
# ${PluginDisplayName}

A complete, production-ready Vendure plugin for ${integration description}.

## Overview
Brief description of what the plugin does and why it's useful.

## Quick Start
```bash
npm install
npm run build --workspace=${plugin-name}
npm run dev:server --workspace=${plugin-name}
```

## Features
- ✅ Complete ${integration} implementation
- ✅ TypeScript best practices (no `any` types)
- ✅ Environment-based configuration
- ✅ Comprehensive error handling
- ✅ Production-ready architecture

## Configuration
Detail all configuration options, environment variables, and setup steps.

## Integration with ${Service}
Step-by-step setup instructions for the external service:
1. Account creation and API key generation
2. Webhook configuration (if applicable)
3. Security and permissions setup
4. Environment variable configuration

## Usage Examples
Practical examples of how to use the plugin.

## Customization
How to extend and modify the plugin for specific needs.

## Architecture
Technical overview of the plugin's design and integration points.
```

### Minimal TESTING.md
Create focused testing documentation that validates core functionality:

```markdown
# Minimal Testing Guide: ${PluginDisplayName}

Quick validation steps for the ${integration} integration.

## Essential Tests

### 1. Build Validation ⚡
```bash
cd examples/${plugin-name}
npm run build
```
**Expected**: No TypeScript errors, builds successfully.

### 2. Local Fallback Test 🏠
```bash
# Start without external service configuration
npm run dev:server
```
**Expected**: Server starts, uses fallback behavior, admin accessible at `http://localhost:3000/admin`.

### 3. Core Functionality Test 🎯
```bash
# Configure service credentials in .env file
[SERVICE_SPECIFIC_ENV_VARS]

# Start server
npm run dev:server
```

**Implementation-Specific Core Test**:
- **Storage Integration**: Upload a file via admin UI → Verify file is stored in external service
- **OAuth Integration**: Attempt SSO login → Verify successful authentication and user creation
- **Payment Integration**: Process a test payment → Verify transaction completes successfully
- **API Integration**: Trigger service interaction → Verify API communication works

## Success Criteria ✅
- **Build completes** without TypeScript errors
- **Server starts** with fallback behavior when service not configured
- **Core functionality works** when service is properly configured
- **Integration validates** with real external service

## Quick Troubleshooting 🔧
**Build fails**: Run `npm install` to ensure dependencies are installed
**Server won't start**: Check for port conflicts (default: 3000)
**Integration fails**: Verify credentials and service configuration in .env file

Total testing time: ~5 minutes
```

## 5. Quality Assurance

### Code Quality Standards
- **No `any` types**: Use proper TypeScript interfaces
- **Error handling**: Comprehensive error catching and logging
- **Security**: No hardcoded secrets, proper validation
- **Performance**: Efficient implementations, proper caching
- **Documentation**: Inline code documentation and examples

### TypeScript Best Practices
- Strict type definitions for all interfaces
- Proper async/await usage
- Generic types where appropriate
- Const assertions for immutable data

### Vendure Integration Standards
- Follow plugin architecture patterns
- Use dependency injection correctly
- Extend configuration properly
- Handle Vendure lifecycle events

### Minimal Testing Validation
- Plugin builds without TypeScript errors
- Server starts with fallback behavior (no external service required)
- Core functionality works with proper service configuration
- Integration validates with real external service
- Essential operations complete successfully

## 6. Final Steps

### Project Structure Validation
Ensure the generated plugin follows this structure:
```
examples/${plugin-name}/
├── README.md                 # Comprehensive documentation
├── TESTING-MINIMAL.md       # Focused 5-minute testing guide
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── src/
│   ├── vendure-config.ts    # Main Vendure configuration
│   ├── index.ts             # Server entry point
│   ├── index-worker.ts      # Worker entry point
│   └── plugins/${plugin-name}/
│       ├── ${plugin-name}.plugin.ts  # Main plugin class
│       ├── types.ts         # TypeScript interfaces
│       ├── constants.ts     # Plugin constants
│       └── [additional implementation files]
└── ${plugin-name}.sqlite    # Separate database file
```

### Installation and Testing
- Install dependencies automatically
- Run initial build to validate setup
- Provide clear next steps for the user

### Success Criteria
The generated example must be:
- ✅ **Functionally Complete**: The core functionality actually works (OAuth login succeeds, payments process, files upload, etc.)
- ✅ **Portable**: Can be copied to any Vendure project and configured
- ✅ **Type-safe**: Proper TypeScript without `any` types
- ✅ **Well-documented**: Comprehensive README with setup instructions and minimal testing guide
- ✅ **Production-ready**: Error handling, security, performance considerations
- ✅ **Integration-specific**: Actually implements the requested functionality with real external service connections
- ✅ **Immediately Testable**: Can be tested end-to-end following the provided instructions

### Quality Gates
Before considering the example complete, verify:
- **End-to-end functionality works**: For OAuth - users can log in, for payments - transactions process, for storage - files transfer
- **All dependencies are correctly specified** in package.json
- **Environment variables are properly configured** with fallbacks
- **Error handling covers common failure scenarios**
- **Documentation includes complete setup instructions** for the external service
- **Minimal testing instructions validate core functionality successfully**
- **TypeScript compiles without errors** and follows best practices

Remember: This command should create a **complete, working example implementation** (typically containing a Vendure plugin) that someone can immediately configure, test, and deploy. The example should demonstrate actual, functional integration with the requested service or feature.
