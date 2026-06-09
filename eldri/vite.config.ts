/// <reference types="node" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const host = process.env.TAURI_DEV_HOST;
const platform = process.env.TAURI_ENV_PLATFORM;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    ...(platform
      ? {
          target: platform === 'windows' ? 'chrome105' : 'safari13',
          minify: !process.env.TAURI_ENV_DEBUG ? ('esbuild' as const) : false,
          sourcemap: !!process.env.TAURI_ENV_DEBUG,
        }
      : {}),
    rollupOptions: {
      input: {
        main: 'index.html',
        widget: 'widget.html',
      },
    },
  },
});
