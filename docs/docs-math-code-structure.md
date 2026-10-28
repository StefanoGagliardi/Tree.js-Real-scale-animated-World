Ecco la trattazione matematica, geometrica e algoritmica di **tutti i file** che compongono l'applicazione WebGL del globo 3D (ispirato all'animazione di Stripe).

---

## 1. Mappatura Geometrica e Proiezioni (Spherical vs 3D vs UV)

La rappresentazione del globo si basa sulla conversione tra tre sistemi di coordinate differenti:

### A. Da Coordinate Geografiche $(\text{Latitudine }, \phi, \text{ Longitudine }, \lambda)$ a Spazio 3D Cardesiano $(X, Y, Z)$

La funzione `coordsToVector3D(lat, lng, radius)` converte la latitudine ($\text{lat} \in [-90^\circ, 90^\circ]$) e la longitudine ($\text{lng} \in [-180^\circ, 180^\circ]$) in un punto tridimensionale sulla superficie di una sfera di raggio $R$:

$$\theta_{\text{polar}} = (90^\circ - \text{lat}) \cdot \frac{\pi}{180}$$

$$\phi_{\text{azimuth}} = \text{lng} \cdot \frac{\pi}{180}$$

Le equazioni cartesiane adottate dal codice sono:


$$X = -R \cdot \sin(\theta_{\text{polar}}) \cdot \cos(\phi_{\text{azimuth}})$$

$$Y = R \cdot \cos(\theta_{\text{polar}})$$

$$Z = R \cdot \sin(\theta_{\text{polar}}) \cdot \sin(\phi_{\text{azimuth}})$$

---

### B. Distribuzione Uniforme dei Punti sulla Sfera (Algoritmo 

 Spiral / Golden Spiral)

Nel file `GlobeClassDots.ts`, i punti non vengono distribuiti a griglia (cosa che concentrerebbe i nodi ai poli), ma usano un'approssimazione della **Spirale di Fibonacci** per ricoprire la sfera in modo uniforme:

Per $i \in [0, N]$ (dove $N = \text{totalDots}$):

1. **Angolo polare ($\phi$):**

$$\phi = \arccos\left(\frac{2i}{N} - 1\right) \quad \in [0, \pi]$$


2. **Angolo azimutale ($\theta$):**

$$\theta = \sqrt{N \cdot \pi} \cdot \phi$$



Attraverso `vector3.setFromSphericalCoords(radius, phi, theta)`, ogni punto ottiene la sua posizione $3\text{D}$ uniforme.

---

### C. Proiezione Inversa: Da Vettore 3D a Coordinate della Mappa Texture ($\text{UV}$)

Per valutare se un determinato punto ricada sulla terraferma o sull'oceano, occorre proiettare la posizione 3D del punto calcolato sulla texture 2D equirettangolare della cartina geografica (`globemap.png`).

La funzione `getDotCoords(sphereBound, localPosition)` fa esattamente l'inverso:

1. Calcola il vettore normale orientato verso la superficie: $\vec{v} = \text{normalize}(\vec{P}_{\text{local}} - \vec{P}_{\text{bound}})$.
2. Calcola la coordinata $U$ ($\text{Longitudine normalizzata } [0, 1]$):

$$U = 1 - \left(0.5 + \frac{\arctan2(v_z, v_x)}{2\pi}\right)$$


3. Calcola la coordinata $V$ ($\text{Latitudine normalizzata } [0, 1]$):

$$V = 0.5 + \frac{\arcsin(v_y)}{\pi}$$



---

## 2. Creazione della Texture della Terraferma (`GlobeClassDots.ts`)

Come viene ricreata la terraferma tramite pallini?

1. **Campionamento dell'Immagine (`ImageData`):**
Viene caricata la maschera in bianco e nero `globemap.png` in un elemento `<canvas>` 2D nascosto e letta tramite `getImageData()`.


2. **Verifica dei Pixel della Mappa (`getImagePixelColor`):**
Le coordinate normalizzate $(U, V)$ calcolate al punto $1.C$ vengono convertite negli indici del buffer della mappa $2\text{D}$ di dimensioni $W \times H$:

$$\text{index} = 4 \cdot (\lfloor U \cdot W \rfloor + \lfloor V \cdot H \rfloor \cdot W)$$



Se il canale Alpha o il valore del pixel `imageData.data[index + 3] > 0` (ovvero il punto appartiene alla terraferma e non all'oceano), il punto viene accettato.


3. **Instanziamento e Costruzione della Geometria Nodi:**
* Viene generato un disco 2D `CircleGeometry(smallRadiusPart, 6)` posizionato nel punto 3D tramite `.lookAt(vector3)` e `.translate(vector3.x, vector3.y, vector3.z)`.


* Le posizioni dei vertici e degli identificatori casuali univoci ($rndId \in [0, 1]$) vengono inserite in un `BufferGeometry` unificato usando `Float32BufferAttribute`.





---

## 3. Animazione e Shader dei Pallini (Vertex & Fragment Shader)

L'effetto pulsante dei nodi e l'animazione di risposta al trascinamento (drag) sono gestiti direttamente dalla GPU tramite un **Custom ShaderMaterial** (`GlobeClassDots.ts`).

### A. Vertex Shader

Il vertex shader calcola la traslazione dei nodi sull'asse radiale in base al tempo ed al drag:

```glsl
attribute float rndId;
varying float vRndId;
varying float pct;

void main() {
  vRndId = rndId;
  
  // Percentuale di completamento caricamento iniziale
  pct = min(1.0, u_time / (1000. / max(0.2, 0.2 * sin(fract(rndId)))));
  
  float vNormal = rndId + ((1.0 - rndId));
  vNormal = smoothstep(0., 1.0, vNormal);
  
  // Effetto "Onda di Pressione" durante il Drag:
  // Sposta la posizione radiale in base a un'onda sinusoidale moltiplicata per il tempo di trascino
  if (u_drag_time > 0.) {
    vNormal -= ((sin(u_time / 400.0 * vRndId) + 1.0) * 0.02) * min(1., u_drag_time / 1200.0);
  }
  
  vec4 modelViewPosition = modelViewMatrix * vec4(position, vNormal);
  gl_Position = projectionMatrix * modelViewPosition;
}

```

### B. Fragment Shader

Il fragment shader calcola la variazione di colore e la trasparenza (effetto luccichio/twinkle):

```glsl
uniform bool u_dragging;
uniform float u_time;
uniform float u_drag_time;
varying float vRndId;
varying float pct;

void main() {
  // 1. Pulso di trasparenza (Twinkle): Funzione sinusoidale dipendente dal tempo e dall'ID casuale del pallino
  float v = sin(u_time / 200.0 * vRndId);
  float alpha = pct * 0.7 + v * 0.2;

  // 2. Colore Base RGB (Azzurro/Blu): R=0.19, G=0.42, B=0.65
  vec3 color = vec3(0.19, 0.42, 0.65);

  // 3. Incremento dinamico del colore durante il Dragging:
  float dragDur = 1200.0;
  float rInc = min(1.0, u_drag_time / dragDur) * (sin(u_drag_time / (dragDur * 0.5) + 1.0) * 0.1);
  float gInc = min(1.0, u_drag_time / dragDur) * (sin(u_drag_time / (dragDur * 0.75) - 1.0) * 0.1);
  float bInc = min(1.0, u_drag_time / dragDur) * (sin(u_drag_time / dragDur) * 0.1);

  if (u_dragging) {
    color.r += rInc;
    color.g += gInc;
    color.b += bInc;
  }

  gl_FragColor = vec4(color, alpha);
}

```

---

## 4. Calcolo delle Linee Archilinee e Curva Bezier 3D (`GlobeClassLine.ts` / `GlobeHelpers.ts`)

Quando si collega un paese A a un paese B con un arco sospeso sul globo, si calcola una **Curva di Bézier Cubica 3D** (`CubicBezierCurve3`).

### A. Geodesica Sferica Intermedia (`P(...)` in `GlobeHelpers.ts`)

Per far sì che la curva segua la curvatura della terra, si utilizzano le equazioni della **Grande Cerchio (Great-Circle Distance)**:

$$\text{distance} = 2 \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lng}}{2}\right)}\right)$$

La funzioneInterpolatrice restituisce due punti intermedi sulla superficie della sfera a $t = 0.25$ (25%) e $t = 0.75$ (75%) dell'arco.

### B. Innalzamento dell'Arco nello Spazio (Control Points)

Per far "decollare" l'arco dalla superficie terrestre, si calcola una quota di scostamento (Offset/Clamp) basata sulla distanza euclidea tra i due Paesi:

$$\text{Clamp} = \text{clamp}(0.5 \cdot \Vert{}\vec{P}_{\text{start}} - \vec{P}_{\text{end}}\Vert{}, 160, 500)$$

I 4 punti di controllo della Bézier cubica $P_0, P_1, P_2, P_3$ sono:

* $P_0 = \text{coordsToVector3D}(\text{lat}_1, \text{lng}_1, R)$
* $P_1 = \text{coordsToVector3D}(\text{lat}_{0.25}, \text{lng}_{0.25}, R + \text{Clamp})$
* $P_2 = \text{coordsToVector3D}(\text{lat}_{0.75}, \text{lng}_{0.75}, R + \text{Clamp})$
* $P_3 = \text{coordsToVector3D}(\text{lat}_2, \text{lng}_2, 1.002 \cdot R)$

Attraverso questi 4 punti, viene costruita una geometria `TubeGeometry(CubicBezierCurve3, ...)`.

---

## 5. Animazione di Disegno, Flusso e Cerchi di Atterraggio (`DrawLinesClass`)

### A. Effetto Disegno Progressivo dell'Arco

L'arco non appare istantaneamente, ma viene disegnato progressivamente controllando il **Draw Range** del buffer geometrico (`TubeGeometry`) combinato con un'equazione di Easing (`easeOutQuart`):

$$e = 1 - (1 - x)^4 \quad \text{dove } x = \frac{\Delta t}{2500\text{ms}}$$

$$\text{count} = \min(3000, \lceil 3000 \cdot e \rceil)$$

$$\text{geometry.setDrawRange}(0, \text{count})$$

### B. Texture Animata lungo l'Arco (Fragment Shader dell'Arco)

Mentre l'arco è visibile, una scia luminosa fluisce lungo di esso modificando le coordinate UV della texture generata:

```glsl
uniform float u_time;
uniform sampler2D u_texture;
varying vec2 vUv;
uniform float speedEpsilon; // 0.0004

void main() {
  float ramp = vUv.x * 0.5;
  float pct = fract(ramp - u_time * speedEpsilon); // Effetto scorrimento UV
  vec4 color = texture2D(u_texture, vec2(pct, 0.6));
  gl_FragColor = color;
}

```

### C. Cerchietti Pulsanti di Partenza e Arrivo

Sulla base di partenza ($P_0$) e atterraggio ($P_3$) vengono posizionati due dischi `PlaneGeometry` orientati verso il centro della terra con `.lookAt(0,0,0)`.
Man mano che l'arco viene tracciato:

* Il primo cerchio aumenta di scala fino a $0.35$: $s_1 = s_1 + 0.01$
* Raggiunto il $50\%$ del tragitto dell'arco ($\text{count} > 1500$), il secondo cerchio si espande: $s_2 = s_2 + 0.015$

---

## 6. Fisica dell'Inerzia e Trascino del Globo (`GlobeClass.ts`)

Quando l'utente rilascia il globo dopo averlo trascinato (evento `mouseup` / `touchend`), si attiva la funzione d'inerzia fisica `throwGlobe(moveX, moveY)`:

1. **Smorzamento dell'impulso (Damping):**

$$v_x(t+1) = 0.94 \cdot v_x(t)$$


$$v_y(t+1) = 0.94 \cdot v_y(t)$$


2. **Aggiornamento delle Rotazioni della Sfera:**

$$\text{Rot}_y = \text{resetRevolutions}(\text{Rot}_y + v_x)$$


$$\text{Rot}_x = \text{clamp}(\text{Rot}_x + v_y, -\frac{\pi}{2}, \frac{\pi}{4})$$


3. La ricorsione prosegue tramite `requestAnimationFrame` finché l'energia cinetica $\vert{}v_x\vert{} < 0.001$ e $\vert{}v_y\vert{} < 0.001$.

---

## 🌟 1. Panoramica della Struttura del Progetto

Il progetto è strutturato seguendo i principi della programmazione ad oggetti (OOP) in TypeScript, sfruttando l'estensione della classe `Group` di Three.js per dividere le responsabilità:

* **`GlobeClassAbstract` & `GlobeClass**`: Il punto di ingresso principale. Gestisce la scena Three.js, la fotocamera ortografica, le luci e la responsività (drag/touch/resize).
* **`GlobeClassDotsAbstract` & `GlobeDotsGroup**`: Gestisce la generazione del globo formato da decine di migliaia di punti (dot) ricavati da una mappa B/W, renderizzati in modo ultra-performante tramite `BufferGeometry` e custom `ShaderMaterial`.
* **`GlobeClassLineAbstract` & `DrawLinesClass**`: Gestisce gli archi di connessione animati tra diverse nazioni del mondo, calcolando curve di Bézier 3D sul globo.
* **`GlobeHelpers`**: Utility matematiche, formule trigonometriche per la conversione di coordinate geografiche (Lat/Lng) in vettori 3D, e funzioni di *easing*.

---

## 🗂️ 2. Analisi dei File e del Codice

### 🌐 A. Il Core del Globo (`GlobeClass.ts` e `GlobeClassAbstract.ts`)

La classe principale eredita da `GlobeClassAbstract` e coordina il rendering WebGL.

#### Caratteristiche chiave:

1. **Camera Ortografica**: Viene usata una `OrthographicCamera` anziché prospettica per mantenere un aspetto piatto e pulito ("isometrico"), regolando la proiezione al resize dello schermo.
2. **Sistema di Illuminazione**: Combina una `AmbientLight` (per l'illuminazione uniforme) e due `PointLight` posizionate a coordinate strategiche per creare profondità e ombreggiature sul globo.
3. **Interazione Utente (Inerzia e Drag)**: Rileva gli eventi di `mousedown`, `mousemove` e `touch`. Quando l'utente trascina e rilascia il globo, viene calcolato un effetto di rilancio inerziale tramite la funzione `throwGlobe()`.

```typescript
// Esempio: Conversione e lancio del globo con attrito inerziale
public throwGlobe = (t: number, i: number): void => {
  const e = 0.94 * t;
  const s = 0.94 * i;
  const a = this.globeContainer.rotation.y + e;
  const n = Math.max(Q, Math.min(B, this.globeContainer.rotation.x + s));
  
  this.globeContainer.rotation.y = this.resetRevolutions(a);
  this.globeContainer.rotation.x = n;
  
  if ((Math.abs(e) > 0.001 || Math.abs(s) > 0.001) && !this.isDragging) {
    this.throwAnimationFrame = requestAnimationFrame(() => {
      this.throwGlobe(e, s);
    });
  }
};

```

---

### 🟢 B. La Mappa di Punti (`GlobeClassDots.ts`)

Questa è una delle parti più affascinanti dal punto di vista dell'ottimizzazione grafica.

#### Come funziona la generazione dei pallini?

1. **Mappa in Trasparenza/Maschera**: Viene caricata un'immagine PNG in bianco e nero del planisfero (`globemap.png`) dentro un `<canvas>` 2D invisibile.
2. **Campionamento Pixel**: Vengono distribuiti uniformemente nello spazio 3D della sfera dai **20.000 agli 80.000 punti** usando le coordinate sferiche (angoli $\phi$ e $\theta$).
3. **Filtro Terra/Mare**: Per ogni punto generato sulla sfera, viene calcolata la corrispondenza sulla mappa 2D. Se il canale Alpha/Colore nell'array `ImageData` del canvas indica che si trova sulla terraferma, il punto viene aggiunto.
4. **Prestazioni con BufferGeometry**: Invece di creare decine di migliaia di `Mesh` individuali (che distruggerebbero le prestazioni), tutti i punti vengono uniti in una singola `BufferGeometry`.

#### Vertex e Fragment Shader (GLSL)

I punti non sono statici: reagiscono quando l'utente trascina il globo grazie ad uno `ShaderMaterial` dedicato:

* **Vertex Shader**: Sposta leggermente la posizione Z dei punti quando si trascina (`u_drag_time`), creando un effetto "onda" o pulsazione.
* **Fragment Shader**: Modifica dinamicamente i canali RGB e l'opacità dei punti in base al tempo ed all'interazione.

```glsl
/* Fragment Shader per i punti del globo */
uniform bool u_dragging;
uniform float u_time;
uniform float u_drag_time;
varying float vRndId;
varying float pct;

void main() {
  float v = sin(u_time / 200.0 * vRndId);
  float alpha = pct * 0.7 + v * 0.2;
  vec3 color = vec3(0.19, 0.42, 0.65);
  
  if (u_dragging) {
    color.r += min(1.0, u_drag_time / 1200.0) * 0.1;
  }

  gl_FragColor = vec4(color, alpha);
}

```

---

### ✈️ C. Archi e Connessioni Animate (`GlobeClassLine.ts`)

Per collegare due nazioni con una linea curva 3D (ad esempio, dall'Italia agli Stati Uniti), il codice esegue i seguenti passaggi:

1. **Coordinate Geografiche → Coordinate Vettoriali 3D**:
Utilizza la formula trigonometrica standard in `coordsToVector3D(lat, lng, radius)` per convertire le coordinate Latitudine/Longitudine in un `Vector3(x, y, z)` sulla sfera Three.js.

```typescript
export function coordsToVector3D(lat: number, lng: number, radius: number): Vector3 {
  const s = (90 - lat) * ConvToRadia;
  const a = lng * ConvToRadia;

  return new Vector3(
    -radius * Math.sin(s) * Math.cos(a),
    radius * Math.cos(s),
    radius * Math.sin(s) * Math.sin(a)
  );
}

```

2. **Curva Bezier 3D e TubeGeometry**:
Vengono calcolati due punti di controllo intermedi (`S` e `D`) elevati rispetto alla superficie della sfera (usando la funzione `clamp` per la curvatura). Viene quindi creata una `CubicBezierCurve3` ed estrusa tramite `TubeGeometry`.
3. **Animazione del Raggio**:
Con la funzione `drawAnimatedLine()`, l'arco non appare all'improvviso, ma viene disegnato gradualmente modificando il `drawRange` della geometria col passare del tempo:
```typescript
this.geometry.setDrawRange(0, t);

```


4. **Punti di Origine e Destinazione**:
Ai due estremi dell'arco vengono posizionati due cerchietti (`PlaneGeometry` con texture `disc_texture.png`) direzionati sempre verso il centro della terra con `lookAt(0,0,0)`.

---

### 📐 D. Utility e Formule Geometriche (`GlobeHelpers.ts`)

File di fondamentale importanza contenente:

* **Costanti di conversione**: Gradi $\leftrightarrow$ Radianti (`ConvToRadia`, `ConvToDegree`).
* **Curve di Easing**: `easeOutQuart`, `easeInOutQuart`, `easeInOutBack` utilizzate per rendere fluide le animazioni di rotazione, comparsa ed estrusione degli archi.
* **Funzione `P()` (Grande Cerchio / Interpolazione)**: Calcola la distanza del grande cerchio tra due punti sulla sfera e restituisce una funzione interpolatrice che calcola le coordinate intermedie a qualsiasi percentuale `t` ($0 \rightarrow 1$).

---

## 🛠️ Come Replicarlo nel Tuo Progetto

Se vuoi utilizzare queste classi nel tuo progetto Next.js o React:

1. Assicurati di installare Three.js e i relativi tipi:
```bash
npm install three @types/three

```


2. Carica gli asset grafici nella tua cartella `public/`:
* `/globe/globemap.png` (Mappa B/W del mondo)
* `/globe/disc_texture.png` (Texture per i punti di connessione)
* `/globe/arc-texture-1.png` ... `4.png` (Gradienti per le linee)


3. Inizializza la classe passandogli un elemento `HTMLDivElement` contenitore:

```typescript
import GlobeClass from './GlobeClass';

const container = document.getElementById('globe-container');
const globe = new GlobeClass(container);
globe.load();
globe.play();

```

---

## 💡 Conclusione

Questo progetto dimostra come, combinando **matematica 3D, Custom Shaders (GLSL) e ottimizzazione delle geometrie (BufferGeometry)**, sia possibile creare esperienze web altamente performanti e di grande impatto visivo anche gestendo oltre 70.000 oggetti a schermo a 60 FPS.