import { defineConfig } from 'vite';
import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import path from 'path';

export default defineConfig({
  base: '/dashboard/',
  plugins: [
    ...vendureDashboardPlugin({
      vendureConfigPath: path.join(__dirname, './vendure-config-wrapper.ts'),
      tempCompilationDir: path.join(__dirname, './.vendure-dashboard-temp'),
      pathAdapter: {
        getCompiledConfigPath: ({ outputPath, configFileName }) => {
          return path.join(outputPath, 'shared', 'dashboard', configFileName.replace('.ts', '.js'));
        },
        transformTsConfigPathMappings: ({ patterns }) => patterns,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.join(__dirname, '../../node_modules/@vendure/dashboard/index.html'),
    },
  },
  resolve: {
    alias: {
      '@/vdb': path.join(__dirname, '../../node_modules/@vendure/dashboard/src/lib'),
      '@shared/config': path.join(__dirname, '../../src/vendure-config.base.ts'),
      '@shared/base': path.join(__dirname, '../../src/vendure-config.base.ts'),
      '@shared/server': path.join(__dirname, '../../src/index.base.ts'),
      '@shared/worker': path.join(__dirname, '../../src/index-worker.base.ts'),
    },
  },
});