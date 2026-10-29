/**
 * tests/setup.ts
 *
 * File eseguito da Vitest prima di ogni suite di test.
 * Configurazione globale del DOM simulato (jsdom) e mock dei moduli
 * che richiedono un contesto browser reale (WebGL, canvas, ecc.)
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock di WebGLRenderer
// Three.js tenta di creare un contesto WebGL reale; jsdom non lo supporta.
// Mockaimo l'intero modulo così i test non crashano sul canvas WebGL.
// ---------------------------------------------------------------------------
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  /**
   * Stub minimo di WebGLRenderer che soddisfa tutte le chiamate
   * effettuate da GlobeClass.addRenderer() senza aprire un contesto WebGL reale.
   */
  const MockWebGLRenderer = vi.fn().mockImplementation(() => ({
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    domElement: document.createElement('canvas'), // canvas DOM reale (jsdom)
    sortObjects: true,
    dispose: vi.fn(),
  }));

  return {
    ...actual,           // tutte le classi math/geometry/scene rimangono reali
    WebGLRenderer: MockWebGLRenderer,
  };
});

// ---------------------------------------------------------------------------
// Mock di GlobeClassDots (carica texture via ImageLoader in modo asincrono)
// ---------------------------------------------------------------------------
vi.mock('@/components/three/globe/GlobeClassDots', () => {
  const { Group } = require('three');
  return {
    default: class MockGlobeDotsGroup extends Group {
      constructor(_radius: number, _isStatic: boolean, onLoad: () => void) {
        super();
        // Simula il completamento del caricamento in modo sincrono
        onLoad();
      }
      animate = vi.fn();
      startDragging = vi.fn();
      stopDragging = vi.fn();
    },
  };
});

// ---------------------------------------------------------------------------
// Mock di GlobeEuropeBorders (carica europe.geojson via fetch)
// ---------------------------------------------------------------------------
vi.mock('@/components/three/globe/GlobeEuropeBorders', () => {
  const { Group } = require('three');
  return {
    default: class MockGlobeEuropeBorders extends Group {
      constructor(_radius: number, onLoad: () => void, _color?: number) {
        super();
        onLoad();
      }
      setOpacity = vi.fn();
    },
  };
});

// ---------------------------------------------------------------------------
// Mock di @config/site (richiede Next.js runtime)
// ---------------------------------------------------------------------------
vi.mock('@config/site', () => ({
  getWebSiteUrl: () => 'http://localhost:3000',
}));

// ---------------------------------------------------------------------------
// Mock di TextureLoader (evita fetch di immagini reali nei test)
// ---------------------------------------------------------------------------
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  const MockWebGLRenderer = vi.fn().mockImplementation(() => ({
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    domElement: document.createElement('canvas'),
    sortObjects: true,
    dispose: vi.fn(),
  }));

  const MockTextureLoader = vi.fn().mockImplementation(() => ({
    load: vi.fn().mockImplementation((_url: string, onLoad?: () => void) => {
      if (onLoad) onLoad();
      return {};
    }),
  }));

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
    TextureLoader: MockTextureLoader,
  };
});
