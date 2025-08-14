# Vendure Examples

A collection of portable Vendure configurations and examples that can be copied to any Vendure project.

## Quick Start

```bash
# Install dependencies
npm install

# Create a new example
npm run create-example my-feature

# Build the example
npm run build --workspace=my-feature

# Run the example (optional)
npm run dev:server --workspace=my-feature
```

## How It Works

### 1. Main Store
The `store/` directory contains a standard Vendure installation created with `npx @vendure/create`. This serves as the base configuration that all examples inherit from.

### 2. Examples
Examples are self-contained Vendure projects in the `examples/` directory. Each example:
- Contains a complete, portable `vendure-config.ts`
- Includes all necessary dependencies
- Can be copied to any Vendure project

### 3. Portability
Every example's `vendure-config.ts` is **fully portable**:

```bash
# Copy any example config to your project
cp examples/my-feature/src/vendure-config.ts my-vendure-project/src/

# Copy custom plugins too (if any)
cp -r examples/my-feature/src/plugins my-vendure-project/src/
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run create-example <name>` | Create a new example |
| `npm run list:examples` | List all examples |
| `npm run dev:server --workspace=<name>` | Run example in development |
| `npm run build --workspace=<name>` | Build example |

## Example Structure

When you create an example, you get:

```
examples/my-feature/
├── src/
│   ├── vendure-config.ts    # ← Main config (copy this to your project)
│   ├── plugins/             # ← Custom plugins (if any)
│   ├── index.ts            # Server entry point
│   └── index-worker.ts     # Worker entry point
├── package.json            # Complete dependencies
└── README.md              # Usage instructions
```

## Development Workflow

1. **Create**: `npm run create-example payment-gateway`
2. **Develop**: Edit `examples/payment-gateway/src/vendure-config.ts`
3. **Test**: Build and run the example
4. **Share**: Copy the config to any Vendure project

## Key Features

- ✅ **Fully Portable** - Configs work in any Vendure project
- ✅ **Self-Contained** - Each example includes all dependencies
- ✅ **Standard Structure** - Uses official Vendure patterns
- ✅ **TypeScript Ready** - Full type safety and IntelliSense
- ✅ **No Workspace Dependencies** - Examples are truly independent

## Examples Use Cases

- Payment gateway integrations
- Custom field configurations  
- Plugin demonstrations
- Advanced search setups
- Multi-tenant configurations
- Custom authentication flows

## Requirements

- Node.js 16+
- npm 7+

---

**Need help?** Each generated example includes its own README with specific usage instructions.