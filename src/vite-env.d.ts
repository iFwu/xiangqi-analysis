/// <reference types="vite/client" />

declare module '*.md' {
  const html: string;
  export { html };
}

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
