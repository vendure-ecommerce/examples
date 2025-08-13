# Vendure Templates Workspace

A PNPM workspace monorepo containing a main Vendure store and multiple template implementations.

## Structure

```
vendure-templates/
├── store/                  # Main Vendure store package
├── templates/             # Template stores directory
├── scripts/               # Utility scripts
├── pnpm-workspace.yaml   # PNPM workspace configuration
└── package.json          # Root workspace package.json
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PNPM (v7 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Main Store

```bash
# Development mode
pnpm dev:store

# Build
pnpm build:store
```

The main store will be available at:
- Shop API: http://localhost:3000/shop-api
- Admin API: http://localhost:3000/admin-api  
- Admin UI: http://localhost:3002/admin

Default superadmin credentials:
- Username: `superadmin`
- Password: `superadmin`

## Working with Template Stores

### Creating a New Template Store

```bash
pnpm create-template <store-name>
```

This command will:
- Create a new directory in `templates/<store-name>`
- Set up package.json with workspace linking to the main store
- Generate basic TypeScript configuration
- Create a starter `src/index.ts` file
- Generate a README for the template

### Running Template Stores

After creating a template store:

```bash
# Development mode
pnpm --filter vendure-template-<store-name> dev

# Build
pnpm --filter vendure-template-<store-name> build
```

### Listing Template Stores

```bash
pnpm list:templates
```

## Workspace Features

- **Shared Dependencies**: Common dependencies are hoisted to the workspace root
- **Workspace Linking**: Template stores automatically link to the main store via `workspace:*`
- **TypeScript Support**: Shared TypeScript configuration with project references
- **Independent Scripts**: Each package can be run independently

## Development

### Project Structure

Each template store contains:
- **Complete Vendure setup** - All dependencies included for standalone use  
- **Portable `vendure-config.ts`** - Can be copied to any Vendure project
- **Custom plugins** - Drop-in compatible with any Vendure installation
- **Independent operation** - Templates run with separate databases and ports

### Portability

**The `vendure-config.ts` file in each template is fully portable:**
1. Copy `src/vendure-config.ts` from any template
2. Copy any custom plugins from `src/plugins/` 
3. Paste into any Vendure project created with `npx @vendure/create`
4. Update dependencies in `package.json` if needed

**Templates are completely self-contained** - no workspace dependencies required!

### Adding Dependencies

```bash
# Add to workspace root
pnpm add -w <package-name>

# Add to specific store
pnpm add --filter store <package-name>

# Add to specific template
pnpm add --filter vendure-template-<name> <package-name>
```

### Cleaning

```bash
# Clean all packages
pnpm clean

# Clean specific package
pnpm --filter store clean
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm create-template <name>` | Create a new template store |
| `pnpm dev:store` | Run main store in development |
| `pnpm build:store` | Build main store |
| `pnpm install:all` | Install dependencies for all packages |
| `pnpm clean` | Clean all build outputs |
| `pnpm list:templates` | List all template stores |

## Contributing

When adding new templates:
1. Use the `create-template` script to ensure consistent structure
2. Add meaningful documentation to the template's README
3. Include specific use cases or features the template demonstrates
4. Test that the template works with the main store

## License

MIT