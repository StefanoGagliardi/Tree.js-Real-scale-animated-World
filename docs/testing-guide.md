# Testing del componente Globe — Strumenti e guida ai test

> **Riguarda**: `components/three/globe/` — classe principale `GlobeClass` e funzioni utilitarie

---

## 1. Stack di testing scelto

### Vitest

[Vitest](https://vitest.dev) è il test runner scelto per questo progetto. È costruito sopra **Vite** (lo stesso bundler di Next.js 16) e condivide la sua pipeline TypeScript: nessun Babel aggiuntivo, comprende i path alias di `tsconfig.json` e si avvia in pochi secondi.

| Caratteristica | Dettaglio |
|---|---|
| **Versione** | `vitest@2` — compatibile con `@types/node@^20` del progetto |
| **Language** | TypeScript nativo |
| **Watch mode** | `npm run test:watch` — ricarica solo i file modificati |
| **UI grafica** | `npm run test:ui` — dashboard browser interattiva |
| **Coverage** | `npm run test:coverage` — report HTML via `@vitest/coverage-v8` |

### jsdom

`GlobeClass` è progettato per girare nel browser: legge `document.documentElement.clientWidth`, crea canvas, registra `window.addEventListener`, ecc. **jsdom** è una implementazione JavaScript del DOM che emula l'ambiente browser all'interno di Node.js. Impostando `environment: 'jsdom'` in `vitest.config.ts`, ogni test ha accesso a `document`, `window` e `HTMLElement` come se girasse in Chrome.

```ts
// vitest.config.ts
test: {
  environment: 'jsdom',
}
```

### Struttura delle cartelle

```
globe_three_component/
├── vitest.config.ts
├── tests/
│   ├── setup.ts              ← mock globali (eseguito prima di ogni suite)
│   ├── GlobeClass.test.ts    ← 24 test sulla classe principale
│   └── GlobeHelpers.test.ts  ← 23 test su funzioni utilitarie e config
└── docs/
    └── testing-guide.md      ← questo file
```

---

## 2. Il problema del WebGL nei test (e come lo risolviamo)

Three.js usa `WebGLRenderer` per disegnare sul canvas. In jsdom (Node.js) non esiste un driver grafico: `new WebGLRenderer()` lancerebbe un errore immediato.

La soluzione è **mockare** il modulo `three` nel file `tests/setup.ts`, sostituendo solo `WebGLRenderer` con uno stub che ha la stessa interfaccia ma non tocca la GPU:

```ts
// tests/setup.ts
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  const MockWebGLRenderer = vi.fn().mockImplementation(() => ({
    setPixelRatio: vi.fn(),
    setClearColor:  vi.fn(),
    setSize:        vi.fn(),
    render:         vi.fn(),
    domElement:     document.createElement('canvas'), // canvas DOM reale jsdom
    sortObjects:    true,
  }));

  return {
    ...actual,               // Scene, Vector3, Group ecc. rimangono REALI
    WebGLRenderer: MockWebGLRenderer,
  };
});
```

> **Perché `...actual`?**
> Tutte le classi matematiche di Three.js (`Vector3`, `Scene`, `Group`, `Matrix4`, ecc.) non toccano la GPU e girano perfettamente in Node.js. Nel mock manteniamo quelle reali e sostituiamo solo il renderer.

Stesso approccio per i moduli che fanno I/O in fase di costruzione:
- `GlobeEuropeBorders` — fa `fetch` del file `europe.geojson` al mount
- `GlobeClassDots` — usa `ImageLoader` per le texture della mappa
- `TextureLoader` — carica le texture PNG degli archi animati

---

## 3. Tipologie di test — Un esempio per ciascuna

### 3.1 — Istanziazione della classe

Verifica che la classe possa essere costruita senza errori e che il costruttore (e `super()` dell'abstract) inizializzi le proprietà di base.

**Contesto Three.js**: `GlobeClassAbstract` crea un `Vector2` nel costruttore per tracciare la posizione del mouse durante il drag. `Vector2` è una delle classi matematiche fondamentali di Three.js — una coppia ordinata `(x, y)` che vive puramente in JavaScript, senza GPU.

```ts
it('dovrebbe inizializzare mouse come Vector2', () => {
  const globe = new GlobeClass(container);

  // Vector2 è la classe Three.js per coppie di numeri (x, y).
  // Qui memorizza la posizione del cursore mouse in pixel schermo.
  expect(globe.mouse).toBeInstanceOf(Vector2);
  expect(globe.mouse.x).toBe(0);
  expect(globe.mouse.y).toBe(0);
});
```

---

### 3.2 — Canvas appeso al DOM contenitore

Il test più simile a un **integration test**: verifica che dopo `addRenderer()` il `<canvas>` di Three.js venga realmente inserito nel `div` passato al costruttore.

**Contesto Three.js**: `WebGLRenderer` espone la proprietà `domElement` — l'elemento `<canvas>` HTML sul quale Three.js disegna ogni frame via WebGL. `GlobeClass.addRenderer()` esegue `this.dom.appendChild(this.renderer.domElement)` per agganciarlo alla pagina.

```ts
it('dopo addRenderer() il contenitore deve avere un figlio <canvas>', () => {
  const globe = new GlobeClass(container);

  // Prima di addRenderer(): nessun canvas
  expect(container.querySelector('canvas')).toBeNull();

  // addRenderer() → new WebGLRenderer() → dom.appendChild(renderer.domElement)
  globe.addRenderer();

  const canvas = container.querySelector('canvas');
  expect(canvas).not.toBeNull();
  expect(canvas?.tagName).toBe('CANVAS');
});
```

---

### 3.3 — Costanti matematiche di conversione angolare

Verifica le costanti usate per convertire coordinate geografiche in angoli radiali 3D.

**Contesto Three.js**: Three.js lavora internamente in **radianti**. Le coordinate geografiche (latitudine/longitudine) sono in gradi decimali. Ogni volta che si posiziona un arco, un pallino o un confine sulla sfera, i gradi vengono moltiplicati per `ConvToRadia` per ottenere l'angolo radiale corretto da passare alle funzioni trigonometriche.

```ts
it('ConvToRadia e ConvToDegree sono reciproci: prodotto = 1', () => {
  // Moltiplicare un angolo per ConvToRadia → radianti.
  // Moltiplicare i radianti per ConvToDegree → gradi.
  // Il prodotto delle due costanti deve essere esattamente 1.
  expect(ConvToRadia * ConvToDegree).toBeCloseTo(1, 10);
});
```

---

### 3.4 — Proiezione geografica sulla sfera (coordsToVector3D)

Testa la funzione che converte `(lat, lng)` in un `Vector3` cartesiano sulla superficie del globo.

**Contesto Three.js**: Il globo è una `SphereGeometry` centrata nell'origine della scena. Per posizionare archi, confini e pallini sulla sua superficie esatta, ogni coordinata geografica viene convertita in `Vector3` tramite le coordinate sferiche:

```
φ (phi, colatitudine) = (90° - lat) × ConvToRadia
θ (theta, longitudine) = lng × ConvToRadia

x = -R · sin(φ) · cos(θ)
y =  R · cos(φ)
z =  R · sin(φ) · sin(θ)
```

In Three.js l'asse **Y punta verso l'alto** (polo nord = +Y).

```ts
it('il polo nord (lat=90) deve essere sull\'asse Y positivo', () => {
  const v = coordsToVector3D(90, 0, 500);

  // phi = 0° → sin(0)=0 → x=0, z=0
  // cos(0) = 1 → y = R = 500
  expect(v.x).toBeCloseTo(0, 3);
  expect(v.y).toBeCloseTo(500, 3);
  expect(v.z).toBeCloseTo(0, 3);
});

it('modulo del vettore = R per qualsiasi lat/lng', () => {
  const v = coordsToVector3D(41.9, 12.5, 500); // Roma
  const magnitude = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  expect(magnitude).toBeCloseTo(500, 2);
});
```

---

### 3.5 — Curva di easing per l'animazione reveal

Verifica `Easing.easeOutQuart`: la funzione di interpolazione usata nell'animazione di comparsa del globo.

**Contesto Three.js**: Three.js non ha un sistema di animazione integrato per le proprietà dei materiali. `GlobeClass.render()` aggiorna manualmente `globeFillMaterial.opacity` e l'opacità dei confini europei frame-by-frame. `easeOutQuart` produce una curva che avanza veloce all'inizio e rallenta verso la fine, rendendo il `MeshLambertMaterial` della sfera più naturale da guardare rispetto a una transizione lineare.

```ts
it('a metà del tempo il valore deve già essere > 0.5 (parte veloce)', () => {
  // ease-out copre più della metà del range nei primi 50% del tempo.
  // A t=0.5 su d=1, il valore animato supera già 0.5.
  const result = Easing.easeOutQuart(0.5, 0, 1, 1);
  expect(result).toBeGreaterThan(0.5);
});
```

---

### 3.6 — Timer basato su requestAnimationFrame (Timing.delay)

Verifica `Timing.delay`: il sistema di timer che usa `requestAnimationFrame` invece di `setTimeout` per programmare la scomparsa degli archi.

**Contesto Three.js**: `requestAnimationFrame` (rAF) è la primitiva del browser per sincronizzare il codice con il refresh schermo (60fps). Three.js usa rAF per il render loop principale; `Timing.delay` lo usa per lo stesso motivo — la rimozione di un arco al frame giusto evita che l'oggetto Three.js (`DrawLinesClass`) venga rimosso dalla `Scene` mentre il renderer sta ancora processando quel frame, il che causerebbe artefatti grafici.

In jsdom, rAF esiste ma non avanza automaticamente: va controllato manualmente nel test.

```ts
it('dovrebbe invocare il callback dopo il tempo specificato', () => {
  const rafCallbacks: Array<(time: number) => void> = [];

  // Stub di rAF: invece di schedular il frame nel browser,
  // aggiunge il callback a una coda che controlliamo noi.
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    rafCallbacks.push(cb);
  });
  vi.spyOn(performance, 'now').mockReturnValue(0);

  const callback = vi.fn();
  Timing.delay(callback, 1000);

  // Frame a t=0ms: delay non scaduto, callback non chiamato
  rafCallbacks.shift()!(0);
  expect(callback).not.toHaveBeenCalled();

  // Avanziamo il tempo simulato a 1001ms e scateniamo il frame
  vi.spyOn(performance, 'now').mockReturnValue(1001);
  rafCallbacks.shift()!(1001);

  expect(callback).toHaveBeenCalledOnce();
});
```

---

## 4. Comandi disponibili

```bash
npm test                # run singolo, stampa risultato nel terminale
npm run test:watch      # watch mode — si ricarica ad ogni salvataggio
npm run test:ui         # apre dashboard grafica nel browser
npm run test:coverage   # genera report HTML in coverage/
```

---

## 5. Cosa non viene testato (e perché)

| Area | Motivo |
|---|---|
| Render WebGL effettivo | Richiede GPU — impossibile in CI/Node.js senza driver |
| Loop di animazione `render()` | Dipende da rAF in tempo reale — testato visivamente |
| Caricamento texture reali | Richiedono network o file system — mockate con stub |
| Drag/touch a sequenza | Candidate a test E2E con Playwright |
| `GlobeClassDots` interno | Usa `canvas.getContext('2d')` — supporto parziale in jsdom |
