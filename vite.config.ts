import { defineConfig, type Plugin } from 'vite';

/**
 * Los televisores de 2018-2019 no cargan <script type="module"> y la app corre desde
 * archivos locales, donde crossorigin rompe la carga: se sirve como script clásico.
 */
function classicScript(): Plugin {
  return {
    name: 'classic-script',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: (html) => html.replace(/ type="module"/g, ' defer').replace(/ crossorigin/g, ''),
  };
}

// Tizen 4 y webOS 4 rondan Chrome 53-56: esbuild baja async/await a generadores y el resto a ES2015.
export default defineConfig({
  base: './',
  plugins: [classicScript()],
  build: {
    target: ['es2015', 'chrome53'],
    cssTarget: 'chrome53',
    assetsInlineLimit: 0,
    modulePreload: false,
    rollupOptions: {
      output: { format: 'iife' },
    },
  },
});
