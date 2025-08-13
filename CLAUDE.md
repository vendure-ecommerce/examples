# CLAUDE.md - Vendure Examples Workspace

## Project Overview
This is a PNPM workspace monorepo for Vendure-based example projects. It provides a system for creating portable, self-contained Vendure configurations that can be copied to any standard Vendure project.

## Architecture
- **Main Store**: `store/` - Standard Vendure installation from `npx @vendure/create`
- **Examples**: `examples/` - Self-contained example projects with portable configurations
- **Template Generation**: `scripts/create-example.js` - Creates new examples with workspace linking

## Key Commands
```bash
# Create new example
pnpm create-example <name>

# Run example in development
pnpm --filter vendure-example-<name> dev

# Build example
pnpm --filter vendure-example-<name> build

# List examples
pnpm list:examples

# Install dependencies (run after creating examples)
pnpm install
```

## Project Structure
```
vendure-examples/
├── store/                    # Standard Vendure installation
│   └── src/
│       ├── vendure-config.ts # Base configuration
│       ├── index.ts          # Standard Vendure server
│       └── index-worker.ts   # Standard Vendure worker
├── examples/                 # Generated example stores
│   └── <example-name>/
│       ├── src/
│       │   ├── vendure-config.ts  # Portable config with fallbacks
│       │   ├── index.ts           # Server with custom ports (3001)
│       │   └── index-worker.ts    # Worker process
│       ├── package.json           # Self-contained dependencies
│       └── README.md             # Usage instructions
├── scripts/
│   └── create-example.js     # Template generation script
├── pnpm-workspace.yaml       # PNPM workspace configuration
└── tsconfig.base.json        # Shared TypeScript config
```

## Development Workflow
1. Create example: `pnpm create-example my-feature`
2. Edit configuration: `examples/my-feature/src/vendure-config.ts`
3. Test: `pnpm --filter vendure-example-my-feature build`
4. Run: `pnpm --filter vendure-example-my-feature dev`

## Portability Features
- Examples use separate databases (`<name>.sqlite`)
- Examples use different ports (3001/3003 vs 3000/3002)
- Environment variables have fallback values for portability
- All dependencies are self-contained in each example
- Configurations can be copied to any Vendure project

## TypeScript Configuration
- Uses `"module": "nodenext"` and `"moduleResolution": "nodenext"`
- Project references for efficient builds
- Composite builds enabled for workspace linking

## Testing Commands
```bash
# Build main store first (dependency for examples)
pnpm --filter store build

# Build specific example
pnpm --filter vendure-example-<name> build

# Run type checking
npm run typecheck  # (if available)

# Run linting
npm run lint       # (if available)
```

## Port Configuration
- Main Store: Server 3000, Admin 3002
- Examples: Server 3001, Admin 3003
- Database: Separate SQLite file per example

## Important Notes
- Main store remains a standard Vendure installation for compatibility
- Examples are completely self-contained for maximum portability
- Generated vendure-config.ts includes fallback values for environment variables
- All Vendure-generated comments are preserved in configurations
- Implementation comments have been removed from custom scripts