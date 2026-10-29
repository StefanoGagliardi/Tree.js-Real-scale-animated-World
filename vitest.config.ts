import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    /**
     * jsdom simula il browser environment (window, document, HTMLElement, ecc.)
     * necessario per instanziare GlobeClass che legge document.documentElement.clientWidth
     */
    environment: 'jsdom',

    /**
     * Ricerca automatica dei file di test in tutta la cartella __tests__
     * e file con estensione .test.ts / .spec.ts
     */
    include: ['**/__tests__/**/*.test.ts', '**/*.test.ts', '**/*.spec.ts'],

    /**
     * Cartella globale di setup eseguita prima di ogni suite di test
     */
    setupFiles: ['./tests/setup.ts'],

    /**
     * Coverage con v8 (veloce, nativo Node.js)
     */
    coverage: {
      provider: 'v8',
      include: ['components/three/globe/**/*.ts'],
      exclude: ['**/__tests__/**', '**/node_modules/**'],
      reporter: ['text', 'html'],
    },
  },

  resolve: {
    alias: {
      /**
       * Rispecchia i path alias definiti in tsconfig.json
       * per poter fare import come: import { getWebSiteUrl } from '@config/site'
       */
      '@': path.resolve(__dirname, './'),
      '@config': path.resolve(__dirname, './config'),
    },
  },
});
