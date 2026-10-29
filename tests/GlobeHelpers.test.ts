/**
 * tests/GlobeHelpers.test.ts
 *
 * Test suite per le funzioni di utilità in GlobeHelpers.ts e la funzione
 * coordsToVector3D esportata da GlobeClass.ts.
 *
 * Cosa verifichiamo:
 * - Costanti matematiche (ConvToRadia, ConvToDegree, PiMezzi)
 * - coordsToVector3D: conversione lat/lng → Vector3 cartesiano
 * - Easing.easeOutQuart: curva di easing per l'animazione reveal
 * - Timing.delay: invocazione del callback dopo il ritardo
 * - GlobeConfig: valori di configurazione presenti e tipizzati correttamente
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConvToRadia, ConvToDegree, PiMezzi, Easing, Timing } from '@/components/three/globe/GlobeHelpers';
import { coordsToVector3D } from '@/components/three/globe/GlobeClass';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Suite: Costanti matematiche
// ---------------------------------------------------------------------------
describe('GlobeHelpers – Costanti matematiche', () => {

  it('ConvToRadia = PI / 180 (fattore di conversione gradi → radianti)', () => {
    expect(ConvToRadia).toBeCloseTo(Math.PI / 180, 10);
  });

  it('ConvToDegree = 180 / PI (fattore di conversione radianti → gradi)', () => {
    expect(ConvToDegree).toBeCloseTo(180 / Math.PI, 10);
  });

  it('ConvToRadia e ConvToDegree sono reciproci: prodotto = 1', () => {
    expect(ConvToRadia * ConvToDegree).toBeCloseTo(1, 10);
  });

  it('PiMezzi = PI / 2', () => {
    expect(PiMezzi).toBeCloseTo(Math.PI / 2, 10);
  });

  it('90 gradi × ConvToRadia = PiMezzi', () => {
    expect(90 * ConvToRadia).toBeCloseTo(PiMezzi, 10);
  });

  it('PiMezzi × ConvToDegree = 90 gradi', () => {
    expect(PiMezzi * ConvToDegree).toBeCloseTo(90, 10);
  });
});

// ---------------------------------------------------------------------------
// Suite: coordsToVector3D
// ---------------------------------------------------------------------------
describe('GlobeClass – coordsToVector3D (lat/lng → Vector3 cartesiano)', () => {
  const R = 500; // raggio di test

  it('dovrebbe restituire un oggetto Vector3', () => {
    const v = coordsToVector3D(0, 0, R);
    expect(v).toBeInstanceOf(Vector3);
  });

  it('il polo nord (lat=90, lng=0) dovrebbe essere sull\'asse Y positivo', () => {
    const v = coordsToVector3D(90, 0, R);
    // Al polo nord: phiPolar = 0 → sin(0)=0 → x=0, z=0; cos(0)=1 → y=R
    expect(v.x).toBeCloseTo(0, 3);
    expect(v.y).toBeCloseTo(R, 3);
    expect(v.z).toBeCloseTo(0, 3);
  });

  it('il polo sud (lat=-90, lng=0) dovrebbe essere sull\'asse Y negativo', () => {
    const v = coordsToVector3D(-90, 0, R);
    expect(v.x).toBeCloseTo(0, 3);
    expect(v.y).toBeCloseTo(-R, 3);
    expect(v.z).toBeCloseTo(0, 3);
  });

  it('il punto sull\'equatore/meridiano primo (lat=0, lng=0) deve avere |v| = R', () => {
    const v = coordsToVector3D(0, 0, R);
    const magnitude = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    expect(magnitude).toBeCloseTo(R, 3);
  });

  it('ogni punto prodotto dovrebbe avere modulo = R (punto sulla sfera)', () => {
    const coords: [number, number][] = [
      [41.9, 12.5],  // Roma
      [48.8, 2.3],   // Parigi
      [35.6, 139.6], // Tokyo
      [-33.9, 151.2],// Sydney
      [40.7, -74.0], // New York
    ];
    for (const [lat, lng] of coords) {
      const v = coordsToVector3D(lat, lng, R);
      const magnitude = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
      expect(magnitude).toBeCloseTo(R, 2);
    }
  });

  it('due punti agli antipodi devono avere vettori opposti (somma ≈ 0)', () => {
    const v1 = coordsToVector3D(45, 90, R);
    const v2 = coordsToVector3D(-45, -90, R);
    expect(v1.x + v2.x).toBeCloseTo(0, 2);
    expect(v1.y + v2.y).toBeCloseTo(0, 2);
    expect(v1.z + v2.z).toBeCloseTo(0, 2);
  });
});

// ---------------------------------------------------------------------------
// Suite: Easing.easeOutQuart
// ---------------------------------------------------------------------------
describe('GlobeHelpers – Easing.easeOutQuart', () => {

  it('a t=0 deve restituire il valore iniziale (b)', () => {
    const result = Easing.easeOutQuart(0, 0, 1, 1);
    expect(result).toBeCloseTo(0, 5);
  });

  it('a t=d (fine) deve restituire b+c (valore finale)', () => {
    const result = Easing.easeOutQuart(1, 0, 1, 1);
    expect(result).toBeCloseTo(1, 5);
  });

  it('il valore a metà (t=0.5*d) deve essere > 0.5 (curva ease-out accelera)', () => {
    // easeOut è più veloce all'inizio, quindi a metà percorso temporale
    // il valore animato è già > metà del range
    const result = Easing.easeOutQuart(0.5, 0, 1, 1);
    expect(result).toBeGreaterThan(0.5);
  });

  it('il valore deve essere sempre compreso tra b e b+c', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const result = Easing.easeOutQuart(t, 0, 1, 1);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1 + 1e-9); // tolleranza floating point
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: Timing.delay
// ---------------------------------------------------------------------------
describe('GlobeHelpers – Timing.delay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dovrebbe invocare il callback dopo che il tempo specificato è trascorso', () => {
    /**
     * Timing.delay usa requestAnimationFrame (non setTimeout).
     * Simuliamo rAF con una coda sincrona e performance.now() avanzato manualmente.
     */
    let rafTime = 0;
    const rafCallbacks: Array<(time: number) => void> = [];

    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    vi.spyOn(performance, 'now').mockImplementation(() => rafTime);

    const callback = vi.fn();
    Timing.delay(callback, 1000);

    // Simula frame a 0ms – il callback NON deve ancora essere chiamato
    const firstFrame = rafCallbacks.shift()!;
    firstFrame(0);
    expect(callback).not.toHaveBeenCalled();

    // Simula frame a 1001ms – il callback DEVE essere chiamato
    rafTime = 1001;
    const secondFrame = rafCallbacks.shift()!;
    secondFrame(1001);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('non dovrebbe invocare il callback prima del ritardo', () => {
    let rafTime = 0;
    const rafCallbacks: Array<(time: number) => void> = [];

    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    vi.spyOn(performance, 'now').mockImplementation(() => rafTime);

    const callback = vi.fn();
    Timing.delay(callback, 2000);

    // Frame a 999ms – non deve ancora chiamare
    rafTime = 999;
    const frame = rafCallbacks.shift()!;
    frame(999);
    expect(callback).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suite: GlobeConfig – valori di configurazione
// ---------------------------------------------------------------------------
describe('GlobeConfig – valori di configurazione', () => {

  it('LINE_INTERVAL_MS deve essere un numero > 0', async () => {
    const { LINE_INTERVAL_MS } = await import('@/components/three/globe/GlobeConfig');
    expect(typeof LINE_INTERVAL_MS).toBe('number');
    expect(LINE_INTERVAL_MS).toBeGreaterThan(0);
  });

  it('LINE_LIFETIME_MS deve essere maggiore di LINE_INTERVAL_MS', async () => {
    const { LINE_INTERVAL_MS, LINE_LIFETIME_MS } = await import('@/components/three/globe/GlobeConfig');
    expect(LINE_LIFETIME_MS).toBeGreaterThan(LINE_INTERVAL_MS);
  });

  it('LINES_PER_CYCLE deve essere un intero >= 1', async () => {
    const { LINES_PER_CYCLE } = await import('@/components/three/globe/GlobeConfig');
    expect(Number.isInteger(LINES_PER_CYCLE)).toBe(true);
    expect(LINES_PER_CYCLE).toBeGreaterThanOrEqual(1);
  });

  it('STATIC_LINE_COUNT deve essere un intero >= 1', async () => {
    const { STATIC_LINE_COUNT } = await import('@/components/three/globe/GlobeConfig');
    expect(Number.isInteger(STATIC_LINE_COUNT)).toBe(true);
    expect(STATIC_LINE_COUNT).toBeGreaterThanOrEqual(1);
  });

  it('IS_STATIC, DISABLE_FILL, DISABLE_LINES devono essere boolean', async () => {
    const { IS_STATIC, DISABLE_FILL, DISABLE_LINES } = await import('@/components/three/globe/GlobeConfig');
    expect(typeof IS_STATIC).toBe('boolean');
    expect(typeof DISABLE_FILL).toBe('boolean');
    expect(typeof DISABLE_LINES).toBe('boolean');
  });
});
