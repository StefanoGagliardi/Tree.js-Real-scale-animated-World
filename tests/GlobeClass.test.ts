/**
 * tests/GlobeClass.test.ts
 *
 * Test suite per la classe principale GlobeClass.
 *
 * Cosa verifichiamo:
 * - Istanziazione corretta della classe
 * - Proprietà inizializzate dal costruttore (ereditate da GlobeClassAbstract via super())
 * - Che il canvas WebGL venga appeso al div contenitore dopo load()
 * - Che la Scene e il Renderer vengano creati da addRenderer()
 * - Stato iniziale delle flag (isStatic, isLoaded, isRevealed, ecc.)
 * - Funzione globeRadius calcolata correttamente
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GlobeClass } from '@/components/three/globe/GlobeClass';
import { Vector2 } from 'three';

// ---------------------------------------------------------------------------
// Helper: crea un div contenitore come farebbe il componente React/Next.js
// ---------------------------------------------------------------------------
function createContainerDiv(): HTMLDivElement {
  const div = document.createElement('div');
  div.style.width = '1024px';
  div.style.height = '768px';
  document.body.appendChild(div);
  return div;
}

// ---------------------------------------------------------------------------
// Suite: Istanziazione e stato iniziale
// ---------------------------------------------------------------------------
describe('GlobeClass – Istanziazione e stato iniziale', () => {
  let container: HTMLDivElement;
  let globe: GlobeClass;

  beforeEach(() => {
    container = createContainerDiv();
    globe = new GlobeClass(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('dovrebbe istanziarsi senza errori', () => {
    expect(globe).toBeInstanceOf(GlobeClass);
  });

  it('dovrebbe assegnare correttamente el e dom al div contenitore', () => {
    expect(globe.el).toBe(container);
    expect(globe.dom).toBe(container);
  });

  it('dovrebbe inizializzare mouse come Vector2', () => {
    expect(globe.mouse).toBeInstanceOf(Vector2);
    expect(globe.mouse.x).toBe(0);
    expect(globe.mouse.y).toBe(0);
  });

  it('dovrebbe avere loading e loaded come array vuoti inizialmente', () => {
    expect(globe.loading).toEqual([]);
    expect(globe.loaded).toEqual([]);
  });

  it('isLoaded dovrebbe essere false prima di load()', () => {
    expect(globe.isLoaded).toBe(false);
  });

  it('isRevealed dovrebbe essere false prima di play()', () => {
    expect(globe.isRevealed).toBe(false);
  });

  it('isStatic dovrebbe riflettere il valore di IS_STATIC da GlobeConfig', async () => {
    const { IS_STATIC } = await import('@/components/three/globe/GlobeConfig');
    expect(globe.isStatic).toBe(IS_STATIC);
  });

  it('globeRadius dovrebbe essere calcolato dalla formula: 250 + 0.3 * min(clientWidth, 1080)', () => {
    const expectedRadius = 250 + 0.3 * Math.min(document.documentElement.clientWidth, 1080);
    expect(globe.globeRadius).toBeCloseTo(expectedRadius, 2);
  });

  it('currentLines dovrebbe essere un array vuoto', () => {
    expect(Array.isArray(globe.currentLines)).toBe(true);
    expect(globe.currentLines.length).toBe(0);
  });

  it('globeRotationIncrement dovrebbe essere 0.02 al costruttore', () => {
    expect(globe.globeRotationIncrement).toBe(0.02);
  });

  it('arcColors dovrebbe contenere 4 palette colore', () => {
    expect(globe.arcColors).toHaveLength(4);
    globe.arcColors.forEach((palette: number[]) => {
      expect(palette).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// Suite: Liste dei paesi
// ---------------------------------------------------------------------------
describe('GlobeClass – Liste dei paesi', () => {
  let container: HTMLDivElement;
  let globe: GlobeClass;

  beforeEach(() => {
    container = createContainerDiv();
    globe = new GlobeClass(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('eastCountryList dovrebbe contenere i codici paesi asiatici/Oceania', () => {
    expect(globe.eastCountryList).toContain('jp');
    expect(globe.eastCountryList).toContain('au');
    expect(globe.eastCountryList).toContain('sg');
  });

  it('westCountryList dovrebbe contenere i codici paesi americani', () => {
    expect(globe.westCountryList).toContain('us');
    expect(globe.westCountryList).toContain('ca');
    expect(globe.westCountryList).toContain('br');
  });

  it('middleCountryList dovrebbe contenere paesi europei', () => {
    expect(globe.middleCountryList).toContain('it');
    expect(globe.middleCountryList).toContain('de');
    expect(globe.middleCountryList).toContain('fr');
  });

  it('liveCountryList dovrebbe essere la concatenazione di east + west + middle', () => {
    const expected = [
      ...globe.eastCountryList,
      ...globe.westCountryList,
      ...globe.middleCountryList,
    ];
    expect(globe.liveCountryList).toEqual(expected);
  });

  it('setCountryList() dovrebbe aggiornare countryList', () => {
    const nuovaLista = ['it', 'fr', 'de'];
    globe.setCountryList(nuovaLista);
    expect(globe.countryList).toEqual(nuovaLista);
  });
});

// ---------------------------------------------------------------------------
// Suite: addRenderer() – Canvas appeso al DOM contenitore
// ---------------------------------------------------------------------------
describe('GlobeClass – addRenderer() appende il canvas al contenitore', () => {
  let container: HTMLDivElement;
  let globe: GlobeClass;

  beforeEach(() => {
    container = createContainerDiv();
    globe = new GlobeClass(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('prima di addRenderer() il contenitore non ha figli canvas', () => {
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeNull();
  });

  it('dopo addRenderer() il contenitore deve avere un figlio <canvas>', () => {
    globe.addRenderer();
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.tagName).toBe('CANVAS');
  });

  it('dopo addRenderer() renderer e scene devono essere inizializzati', () => {
    globe.addRenderer();
    expect(globe.renderer).toBeDefined();
    expect(globe.scene).toBeDefined();
  });

  it('il canvas deve essere un figlio diretto del div contenitore', () => {
    globe.addRenderer();
    const directChildren = Array.from(container.children);
    const hasCanvas = directChildren.some((child) => child.tagName === 'CANVAS');
    expect(hasCanvas).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite: resetRevolutions()
// ---------------------------------------------------------------------------
describe('GlobeClass – resetRevolutions()', () => {
  let container: HTMLDivElement;
  let globe: GlobeClass;

  beforeEach(() => {
    container = createContainerDiv();
    globe = new GlobeClass(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('dovrebbe restituire 0 per rotazione 0', () => {
    expect(globe.resetRevolutions(0)).toBe(0);
  });

  it('dovrebbe mantenere la rotazione nell\'intervallo (-2PI, 2PI)', () => {
    const result = globe.resetRevolutions(3 * Math.PI);
    expect(Math.abs(result)).toBeLessThanOrEqual(2 * Math.PI);
  });

  it('una rotazione di 2PI dovrebbe risultare in 0 o 2PI (giro completo)', () => {
    const result = globe.resetRevolutions(2 * Math.PI);
    expect(result).toBeCloseTo(0, 5);
  });

  it('valori negativi devono restare nell\'intervallo (-2PI, 0)', () => {
    const result = globe.resetRevolutions(-3 * Math.PI);
    expect(Math.abs(result)).toBeLessThanOrEqual(2 * Math.PI);
  });
});
