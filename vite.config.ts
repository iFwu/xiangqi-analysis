import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import cdn from 'vite-plugin-cdn-import';

declare const process: {
  env: {
    GITHUB_PAGES?: string;
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
          path: 'opencv.js',
        },
      ],
    }),
  ],
  server: {
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
});