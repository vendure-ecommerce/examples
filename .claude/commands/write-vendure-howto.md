# Write Vendure How-To Guide

Create a comprehensive Vendure how-to guide for: $ARGUMENTS

Follow the established Vendure documentation patterns and structure:

## 1. Research and Planning

### Example-Based Guide Foundation

- **Base your guide on a working example** from the `examples/` directory
- **Link to the complete example** on GitHub: `https://github.com/vendure-ecommerce/examples/tree/master/examples/[example-name]`
- **Focus on technical implementation** rather than boilerplate files
- **Exclude auto-generated content** (package-lock.json, basic config files, standard directory structures)

### Documentation Research

- **Fetch current Vendure documentation** from:
  - Main docs: https://github.com/vendure-ecommerce/vendure/tree/master/docs
  - How-to guides: https://github.com/vendure-ecommerce/vendure/tree/master/docs/docs/guides/how-to
- **Study existing guides** for similar topics to understand patterns and approaches
- **Identify the target audience** and their assumed knowledge level
- **Plan the guide structure** with logical progression from basic to advanced concepts

## 2. Document Format & Docusaurus Structure

### File Format Requirements

- **File extension**: Use `.mdx` for Docusaurus compatibility (supports React/JSX components and advanced features)
- **File location**: Place in `docs/guides/how-to/[topic-name]/index.mdx`
- **Required frontmatter**:

```yaml
---
title: "Descriptive Title"
---
```

### Docusaurus-Specific Features

- **Admonitions**: Use `:::note`, `:::info`, `:::tip`, `:::warning`, `:::danger` blocks
- **CLI callouts**: Use `:::cli` for CLI-specific instructions (see CLI Guidelines below)
- **Code blocks**: Include language specification and optional title:

```ts title="src/my-file.ts"
// TypeScript code here
```

- **Highlighting**: Use `// highlight-next-line` or `// highlight-start` / `// highlight-end`
- **Internal links**: Use relative paths `/guides/path/to/doc/`
- **External links**: Standard markdown `[text](https://example.com)`

### Guide Structure and Content

#### Introduction Section

- Start with a brief, practical explanation of **what** the guide will accomplish
- Explain **why** this feature/functionality is useful
- Outline **what the reader will learn** by following the guide

#### Step-by-Step Implementation

- Use **clear H2 and H3 headings** to organize sections logically
- **Progressive complexity**: Start with basic setup, then add advanced features
- Each section should follow this pattern:
  1. Brief explanatory text describing the concept
  2. Complete, practical code examples with syntax highlighting
  3. Additional context or implementation notes

#### Code Examples Standards

- Use **TypeScript** for all code examples
- **Extract from working example projects** - avoid theoretical code
- Include **complete, runnable code snippets** rather than fragments
- Add **helpful comments** within code blocks to explain key concepts
- **Focus on integration logic** - skip standard boilerplate and auto-generated files
- Highlight **important lines** using `// highlight-next-line` comments

## 3. Writing Style Guidelines

### Tone and Voice

- **Professional and educational** - assume developer-level knowledge
- **Direct and practical** - focus on implementation details
- **Neutral and matter-of-fact** - avoid marketing language
- **Clear and concise** - eliminate unnecessary words

### Technical Writing Patterns

- Use **active voice** when possible
- **Define technical terms** when first introduced
- **Provide context** before diving into code
- **Explain the "why"** behind implementation decisions
- Use **consistent terminology** throughout the guide

## 4. Code Implementation Requirements

### TypeScript Best Practices

- Use **strict type safety** - never use `any` type
- Provide **explicit type definitions** for complex objects
- Use **proper async/await** syntax for asynchronous operations
- Follow **established Vendure patterns** and conventions

### Integration with Vendure

- Show how to integrate with **existing Vendure systems** (plugins, strategies, etc.)
- Demonstrate **proper configuration** in vendure-config.ts
- Include **database schema considerations** if applicable
- Show **GraphQL API integration** where relevant

## 5. Quality and Testing

### Code Quality

- Ensure all code examples **compile and run correctly**
- Follow **Vendure's architectural patterns**
- Include **error handling** in examples where appropriate
- Show **testing strategies** for the implemented functionality

### Documentation Quality

- **Proofread** for grammar, spelling, and technical accuracy
- Ensure **logical flow** from concept introduction to implementation
- Verify **code examples work** with current Vendure versions
- Include **troubleshooting tips** for common issues

## 6. 3rd Party Integration Guidelines

When writing guides that involve external services, include **precise setup instructions** with direct links and step-by-step processes for obtaining API keys and credentials.

### Example: Google OAuth Setup

For guides requiring Google authentication (based on [shop-google-auth example](https://github.com/vendure-ecommerce/examples/tree/master/examples/shop-google-auth)), include:

### Setting up Google OAuth Authentication

1. **Access Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Required APIs**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" (or "Google Identity Services")
   - Click "ENABLE"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "CREATE CREDENTIALS" > "OAuth 2.0 Client ID"
   - Configure authorized origins (e.g., `http://localhost:3001` for development)
   - **Important**: Add all your domains to authorized origins

4. **Configure Environment Variables**

   ```bash
   # .env
   GOOGLE_CLIENT_ID=your_google_client_id_here

   # Frontend .env.local
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

Apply this same pattern for other 3rd party services (Stripe, AWS, etc.) - always include:

- Direct console/dashboard links
- Step-by-step credential acquisition
- Security configuration guidance
- Environment variable examples
- **Screenshot placeholders** for complex UI navigation: `<<< SCREENSHOT OF GOOGLE CLOUD CONSOLE OAUTH CREDENTIALS PAGE NEEDED >>>`

## 7. CLI Command Guidelines

When including CLI commands in your guides, **always use non-interactive mode** for better documentation clarity and automation support. The non-interactive mode allows readers to copy commands directly without interactive prompts.

### CLI Command Examples

**Plugin Creation:**

```bash
# Create a new plugin with specific features
npx vendure add -p PaymentIntegrationPlugin
```

**Entity Generation:**

```bash
# Add an entity to an existing plugin with features
npx vendure add -e CustomerReward --selected-plugin LoyaltyPlugin --custom-fields --translatable
```

**Service Addition:**

```bash
# Add a service to a plugin with specific type
npx vendure add -s PaymentProcessorService --selected-plugin PaymentIntegrationPlugin --type entity
```

### CLI Callout Format

Use the `:::cli` admonition for CLI-specific instructions:

````markdown
:::cli
Use the non-interactive mode to quickly set up this feature:

```bash
npx vendure add -p MyPlugin
npx vendure add -e MyEntity --selected-plugin MyPlugin --custom-fields
```
````

:::

````

### Migration Commands
For database-related guides, include migration commands:

```bash
# Generate migration for schema changes
npx vendure migrate -g add-custom-payment-fields

# Run pending migrations
npx vendure migrate -r
````

## 8. Final Structure Template

````markdown
---
title: "Descriptive Title"
---

Brief introduction explaining what this guide covers and why it's useful.

:::info
This guide is based on the [example-name](https://github.com/vendure-ecommerce/examples/tree/master/examples/example-name) example.
Refer to the complete working code for full implementation details.
:::

## Prerequisites

- List only technical requirements and installation dependencies
- Include 3rd party account requirements (do NOT include conceptual knowledge requirements)

## Installation

```bash
npm install required-packages
```
````

:::note
Vendure requires Node.js 20+ and uses npm as the package manager.
:::

## 3rd Party Service Setup

Step-by-step instructions for external service configuration...

## Plugin Creation

:::cli
Create the plugin structure using Vendure CLI for enhanced portability:

```bash
npx vendure add -p MyPlugin
```

:::

## Configuration

Add configuration to your Vendure config:

```ts title="src/vendure-config.ts"
// highlight-start
import { MyPlugin } from "./plugins/my-plugin/my-plugin.plugin";
// highlight-end

export const config: VendureConfig = {
  // ... other config
  plugins: [
    // highlight-next-line
    MyPlugin.init({
      // configuration options
    }),
  ],
};
```

:::note
**IMPORTANT**: Always create plugins using the Vendure CLI. The CLI automatically places plugins in the `src/plugins/` directory and follows Vendure best practices for enhanced portability.
:::

## [Main Section 1]

Explanatory text...

```ts title="src/plugins/my-plugin/my-service.ts"
// Complete code example with comments
```

:::cli
Use the non-interactive mode to quickly set up this feature:

```bash
npx vendure add -p MyPlugin
npx vendure add -e MyEntity --selected-plugin MyPlugin --custom-fields
```

:::

## [Main Section 2]

Continue with progressive complexity...

## Testing

How to test the implementation...

## Conclusion

Brief summary of what was accomplished and next steps.

```

Remember to:
- **Base guides on working examples** from the examples/ directory
- **Link to the complete GitHub example** for full reference
- **Extract technical implementation details** while avoiding boilerplate
- **Test all code examples** in a real Vendure environment
- **Keep examples practical** and related to real use cases
- **Maintain consistency** with existing Vendure documentation style
- **Focus on developer experience** and ease of implementation
- **Include precise 3rd party setup instructions** with direct links and step-by-step processes
```
