import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isExpress = (env.VITE_BACKEND_TYPE || 'express') === 'express';
  const target = isExpress ? 'http://127.0.0.1:3002' : 'http://127.0.0.1:3001';

  return {
    server: {
      host: '0.0.0.0',
      port: 5176,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
        '/uploads': {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
