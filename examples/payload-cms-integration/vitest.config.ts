import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/**/__tests__/**/*.{ts,tsx,js}",
      "src/**/*.(test|spec).{ts,tsx,js}",
    ],
    exclude: ["node_modules", "dist", ".git", "**/*.d.ts"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/index.ts"],
    },
    globals: true,
    pool: "threads",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
