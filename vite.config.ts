import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import cdn from 'vite-plugin-cdn-import';

declare const process: {
  env: {
    GITHUB_PAGES?: string;
    VITE_GIT_COMMIT_HASH?: string;
  };
};

export default defineConfig({
  plugins: [
    preact(),
    cdn({
      modules: [
        {
          name: '@techstark/opencv-js',
          var: 'cv',
          path: 'dist/opencv.js',
        },
      ],
    }),
  ],
  server: {
    // hmr: false,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      'pikafish': 'third_party/pikafish.js'
    },
  },
  optimizeDeps: {
    include: ['pikafish'],
  },
  // 根据环境动态设置 base
  base: process.env.GITHUB_PAGES === 'true' ? '/xiangqi-analysis/' : '/',
  define: {
    'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(process.env.VITE_GIT_COMMIT_HASH),
  },
});