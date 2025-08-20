# CLAUDE.md - Vendure Examples Workspace

## AI Context Information

You are currently in the **EXAMPLES DIRECTORY** of the Vendure Examples Workspace. This directory contains the examples workspace with self-contained Vendure example projects.

### Key Resources
- **Main Store**:  
  Located under `store/`.  
  This folder contains the standard Vendure installation used as a base for examples.

- **Examples**:  
  Located under `examples/`.  
  This folder contains self-contained example projects with portable configurations that demonstrate various Vendure features and integrations.

- **Scripts**:  
  Located under `scripts/`.  
  Contains the `create-example.js` script for generating new examples.

- **Vendure Documentation**:  
  Current Vendure documentation can be fetched from:
  - Main docs: https://github.com/vendure-ecommerce/vendure/tree/master/docs
  - How-to guides: https://github.com/vendure-ecommerce/vendure/tree/master/docs/docs/guides/how-to
  Use these resources for tutorial and how-to related requests.

Feel free to explore these directories to understand the structure and context of the examples workspace!

## Project Overview
This is an npm workspace monorepo for Vendure-based example projects. It provides a system for creating portable, self-contained Vendure configurations that can be copied to any standard Vendure project.

## Architecture
- **Main Store**: `store/` - Standard Vendure installation from `npx @vendure/create`
- **Examples**: `examples/` - Self-contained example projects with portable configurations
- **Template Generation**: `scripts/create-example.js` - Creates new examples with workspace linking

## Key Commands
```bash
# Create new example
npm run create-example <name>

# Run example in development
cd examples/<name>
npm run dev:server

# Build example
cd examples/<name>
npm run build

# List examples
npm run list:examples

# Install dependencies
npm install

# Run main store
cd store
npm run dev

# Build main store
cd store
npm run build
```

## Project Structure
```
examples/                     # Current directory (examples workspace)
├── store/                    # Standard Vendure installation
│   ├── src/
│   │   ├── vendure-config.ts # Base configuration
│   │   ├── index.ts          # Standard Vendure server
│   │   └── index-worker.ts   # Standard Vendure worker
│   └── package.json          # Store dependencies
├── examples/                 # Generated example stores
│   └── <example-name>/
│       ├── src/
│       │   ├── vendure-config.ts  # Portable config with fallbacks
│       │   ├── index.ts           # Server
│       │   └── index-worker.ts    # Worker process
│       ├── package.json           # Self-contained dependencies
│       └── README.md             # Usage instructions
├── scripts/
│   └── create-example.js     # Template generation script
├── package.json              # npm workspace configuration
├── tsconfig.base.json        # Shared TypeScript config
└── CLAUDE.md               # This file (project instructions)
```

## Development Workflow
1. Create example: `npm run create-example my-feature`
2. Edit configuration: `examples/my-feature/src/vendure-config.ts`
3. Navigate to example: `cd examples/my-feature`
4. Test: `npm run build`
5. Run: `npm run dev:server`

## Senior Engineer Guidance for AI Collaboration
As a senior TypeScript engineer overseeing this workspace, your primary directive is to uphold the architectural integrity and maintain the highest standards of code quality, with a strong emphasis on TypeScript best practices. Your modifications and contributions must reflect a deep understanding of type safety and modular design. 👨‍💻

### Core Directives & Best Practices
Uphold Strict Type Safety at All Costs:
- Never use any as a shortcut. The use of any defeats the purpose of TypeScript. If a type is genuinely unknown, use the unknown type and perform proper type checking or safe casting before use. The goal is to eliminate implicit anys from the codebase.
- Respect Required Types: Do not remove or make optional a required property from a type definition (e.g., in VendureConfig) simply to solve a compilation error. Instead, provide a valid default value, a mock implementation, or an environment variable with a fallback that satisfies the type contract. The type system is a feature, not an obstacle.
- Leverage Type Inference: Write code that allows TypeScript's compiler to infer types whenever possible, but provide explicit types for all function signatures and complex object structures to improve clarity and long-term maintainability.

### Preserve Configuration Portability:
- Every example within examples/ must remain completely self-contained. When adding new features or plugins, ensure all logic, dependencies (package.json), and configurations are encapsulated within that example's directory.
- Do not introduce dependencies or imports that cross the boundary from an individual example (examples/<name>) to the main store (store/) or other examples. This is critical for portability.

### Adhere to Established Patterns:
- When creating new examples or modifying existing ones, strictly follow the patterns established by the create-example.js script and the existing project structure.
- The vendure-config.ts in each example is a portable module. Any plugins or custom logic you add should be imported and composed within this file in a clean, readable, and type-safe manner.

### Master Asynchronous Code:
- Vendure's architecture is heavily asynchronous. All database operations, event handling, and service layer logic involve Promises.
- Always use async/await syntax correctly. Ensure all promises are properly awaited and wrap asynchronous operations that can fail in try...catch blocks for robust error handling. Never leave a Promise unhandled.

Your role is to act as a force for quality and consistency. By following these principles, you will ensure the workspace remains robust, maintainable, and a valuable resource for demonstrating Vendure's capabilities.



## Portability Features
- Examples use separate databases (`<name>.sqlite`)
- Examples use standard Vendure port (3000)
- Environment variables have fallback values for portability
- All dependencies are self-contained in each example
- Configurations can be copied to any Vendure project

## TypeScript Configuration
- Uses `"module": "nodenext"` and `"moduleResolution": "nodenext"`
- Project references for efficient builds
- Composite builds enabled for workspace linking

## Testing Commands
```bash
# Build main store first
cd store
npm run build

# Build specific example
cd examples/<name>
npm run build
```

## Port Configuration
- Main Store: Server 3000 (all APIs and Admin UI served on same port)
- Examples: Server 3000 (all APIs and Admin UI served on same port)
- Database: Separate SQLite file per example
- Note: Each example should be run individually to avoid port conflicts

## Vendure Endpoints (all on port 3000)
- Shop API: `http://localhost:3000/shop-api`
- Admin API: `http://localhost:3000/admin-api`
- Admin UI: `http://localhost:3000/admin`
- GraphiQL Admin: `http://localhost:3000/graphiql/admin`
- GraphiQL Shop: `http://localhost:3000/graphiql/shop`
- Asset server: `http://localhost:3000/assets`
- Dev mailbox: `http://localhost:3000/mailbox`

## Important Notes
- Main store remains a standard Vendure installation for compatibility
- Examples are completely self-contained for maximum portability
- Generated vendure-config.ts includes fallback values for environment variables
- All Vendure-generated comments are preserved in configurations
- Implementation comments have been removed from custom scripts
