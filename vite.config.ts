import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import cdn from 'vite-plugin-cdn2';
import { Mode, plugin as markdown } from 'vite-plugin-markdown';

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
          relativeModule: 'dist/opencv.js',
          global: 'cv',
        },
      ],
      resolve: {
        name: '@techstark/opencv-js',
        setup() {
          return {
            url: 'https://cdn.jsdmirror.com/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js',
            injectTo: 'body',
            attrs: {
              async: true,
              onload: 'cv.onRuntimeInitialized = () => { document.dispatchEvent(new Event(\'opencv-loaded\')); }',
            },
          };
        },
      },
    }),
    markdown({ mode: [ Mode.HTML ] }),
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
    include: [ 'pikafish' ],
  },
  // 根据环境动态设置 base
  base: process.env.GITHUB_PAGES === 'true' ? '/xiangqi-analysis/' : '/',
  define: {
    'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(process.env.VITE_GIT_COMMIT_HASH),
  },
});