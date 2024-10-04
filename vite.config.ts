import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

declare const process: {
  env: {
    GITHUB_PAGES?: string;
  };
};

// 检查是否是 GitHub Pages 环境
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [ preact() ],
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
    include: [ 'pikafish' ],
  },
  // 根据环境动态设置 base
  base: isGitHubPages ? '/xiangqi-analysis/' : '/',
});
