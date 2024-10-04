import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

declare const process: {
  env: {
    GITHUB_PAGES?: string;
    NODE_ENV?: string;
  };
};

// 检查是否是 GitHub Pages 环境
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
// 检查是否是生产环境
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
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
  base: isGitHubPages ? '/xiangqi-analysis/' : '/',
  // 添加 HTML 替换逻辑
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  plugins: [
    preact(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        // 只在生产环境中注入统计脚本
        if (isProduction) {
          return html.replace(
            '%VITE_UMAMI_SCRIPT%',
            '<script defer src="https://cloud.umami.is/script.js" data-website-id="ddd3bcb8-a0eb-45a2-b7e9-8cee5abe39af"></script>'
          );
        }
        // 在开发环境中移除占位符
        return html.replace('%VITE_UMAMI_SCRIPT%', '');
      },
    },
  ],
});
