import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.GEMINI_API_KEY || 'AIzaSyCc41M3nMQp2eyUujKeoQiEJb-jqrjWouE';
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || apiKey)
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          code: path.resolve(__dirname, 'code.html'),
          code1: path.resolve(__dirname, 'code1.html'),
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
