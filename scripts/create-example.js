const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function createExample(name) {
  const exampleDir = path.join(__dirname, "..", "examples", name);

  // Step 1: Run Vendure create
  console.log(`Creating Vendure example: ${name}`);
  execSync(`npx @vendure/create@master ${name} --ci`, {
    cwd: path.join(__dirname, "..", "examples"),
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_PATH: path.join(__dirname, "..", "node_modules"),
    },
  });

  // Step 2: Create tsconfig.json extending base
  const tsconfigPath = path.join(exampleDir, "tsconfig.json");
  const tsconfigContent = {
    extends: "../../tsconfig.base.json",
    compilerOptions: {
      outDir: "./dist",
      // rootDir: "./src",
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));

  // Step 3: Post-process vendure-config.ts with path aliases
  const configPath = path.join(exampleDir, "src", "vendure-config.ts");
  const configContent = `import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';
import "dotenv/config";

const baseConfig = getBaseConfig();

export const config = mergeConfig(baseConfig, {
  plugins: [
    ...(baseConfig.plugins ?? []),
    // Add your custom plugins here
  ],
  // Add any other overrides here
});
`;

  fs.writeFileSync(configPath, configContent);

  // Step 4: Update index.ts with path aliases
  const indexPath = path.join(exampleDir, "src", "index.ts");
  const indexContent = `
import { runServer } from '@shared/server';
import { config } from './vendure-config';

runServer(config)
  .then(() => console.log('Server started: ${name}'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
`;

  fs.writeFileSync(indexPath, indexContent);

  // Step 5: Update index-worker.ts with path aliases
  const workerPath = path.join(exampleDir, "src", "index-worker.ts");
  const workerContent = `
import { runWorker } from '@shared/worker';
import { config } from './vendure-config';

runWorker(config)
  .then(() => console.log('Worker started: ${name}'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
`;

  fs.writeFileSync(workerPath, workerContent);

  // Step 6: Update package.json to remove Vendure deps and fix dev scripts
  const packageJsonPath = path.join(exampleDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Remove Vendure packages that are now at root
  const vendurePackages = [
    "@vendure/admin-ui-plugin",
    "@vendure/asset-server-plugin",
    "@vendure/core",
    "@vendure/email-plugin",
    "@vendure/graphiql-plugin",
    "dotenv", // Also remove dotenv as it's now loaded via -r dotenv/config
  ];

  vendurePackages.forEach((pkg) => {
    if (packageJson.dependencies) {
      delete packageJson.dependencies[pkg];
    }
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies[pkg];
    }
  });

  // Update dev scripts to use proper Node.js setup
  if (packageJson.scripts) {
    packageJson.scripts["dev:server"] =
      "node -r ts-node/register -r dotenv/config -r tsconfig-paths/register ./src/index.ts";
    packageJson.scripts["dev:worker"] =
      "node -r ts-node/register -r dotenv/config -r tsconfig-paths/register ./src/index-worker.ts";
  }

  // Remove all devDependencies - they're inherited from root package.json in the workspace
  delete packageJson.devDependencies;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Step 7: Ensure shared email templates exist
  const sharedEmailDir = path.join(__dirname, "..", "shared", "static", "email", "templates");
  if (!fs.existsSync(sharedEmailDir)) {
    console.log("📧 Creating shared email templates...");

    // Find an existing example with email templates to copy from
    const examplesDir = path.join(__dirname, "..", "examples");
    const existingExamples = fs.readdirSync(examplesDir);
    let sourceEmailDir = null;

    for (const example of existingExamples) {
      const emailTemplatesPath = path.join(examplesDir, example, "static", "email", "templates");
      if (fs.existsSync(emailTemplatesPath)) {
        sourceEmailDir = path.join(examplesDir, example, "static", "email");
        break;
      }
    }

    if (sourceEmailDir) {
      const sharedStaticDir = path.join(__dirname, "..", "shared", "static");
      fs.mkdirSync(sharedStaticDir, { recursive: true });

      execSync(`cp -r "${sourceEmailDir}" "${path.join(sharedStaticDir, "email")}"`, {
        stdio: "inherit"
      });
      console.log("✅ Shared email templates created successfully!");
    } else {
      console.log("⚠️ No existing email templates found to copy. You may need to create them manually.");
    }
  } else {
    console.log("✅ Shared email templates already exist");
  }

  console.log(`✅ Example '${name}' created and configured!`);
  console.log(`📝 Next steps:`);
  console.log(`  1. cd examples/${name}`);
  console.log(`  2. Add any custom plugins to src/vendure-config.ts`);
  console.log(`  3. Run 'npm run dev' to start the example`);
}

// Run the script
const exampleName = process.argv[2];
if (!exampleName) {
  console.error("Please provide an example name");
  process.exit(1);
}

createExample(exampleName);
