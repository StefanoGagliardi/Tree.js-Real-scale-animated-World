// Import core component from three.js
import { getWebSiteUrl } from '@config/site';
import {
  BufferGeometry,
  CircleGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  ImageLoader,
  IUniform,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import GlobeClassDotsAbstract from './GlobeClassDotsAbstract';
import { DotsDensity } from './GlobeConfig';
import { VoidCallback } from './GlobeTypes';

// (Opzionale) Definiamo il tipo per il canale RGB: esattamente 3 numeri
type RGBColor = [number, number, number];
type ColorName = "blue" | "orange";

// NB: GlobeClassDotsAbstract extends Three.js Group()
class GlobeDotsGroup extends GlobeClassDotsAbstract {

  public dotsColors: { [key in ColorName]: RGBColor } = {
    blue: [0.19, 0.41, 0.65],  
    orange: [1.0, 0.45, 0.1] 
  };

  // (Opzionale) Definiamo il tipo per il canale RGB: esattamente 3 numeri
  constructor(radius: number, isStatic: boolean, callback: VoidCallback, public colorName: ColorName = "blue") {
    // Initialize abstract class
    super(radius, isStatic, callback);

    // Load map image mask
    this.loadMapImage();
  }

  /**
   * Load image and create SPhere with image mask
   * Then texturie image with other (smaller) image: dots textureF
   */
  public loadMapImage = (): void => {
    /**
     * Load map image via Three.js loader
     * NB: C'è un intera sezione di Classi dedicata ai "Loader" ti vari tipi di estensioni file: audio, texture, geometry, cache...
     * A loader for loading an Image. - https://threejs.org/docs/#api/en/loaders/ImageLoader
     */
    new ImageLoader().load(
      `${getWebSiteUrl()}/globe/globemap.png`,
      (imageElement: HTMLImageElement) => {
        // Get image size
        const imgWidth = imageElement.width;
        const imgHeight = imageElement.height;

        // Create Canvas for draw image
        const canvasElement = document.createElement('canvas');

        // Set canvas size at image size
        canvasElement.width = imgWidth;
        canvasElement.height = imgHeight;

        const canvasContext = canvasElement.getContext('2d');
        if (!canvasContext) return;

        canvasContext.drawImage(imageElement, 0, 0);
        const imageData = canvasContext.getImageData(0, 0, imgWidth, imgHeight);

        // Create Sphere, applicate image and texturize it
        this.mapLoaded(imageData);
      }
    );
  };

  /**
   * When map image is loaded and ready to use.
   * NB: ImageData is a Type returned by canvas.getContext2D().getImageData()
   *     imageData returned from getImageData() contain "data" that is one dimensional array color rgba
   */
  public mapLoaded = (imageData: ImageData): void => {
    // Estimat amut of dot and for each generate obect and mask image
    this.generateDots(imageData);

    // console.log("fn mapLoaded() - this.r: ", this.r);
    // console.log("fn mapLoaded() - this.h: ", this.h);

    // Initaializ BufferGeometry
    const bufferGeometry = new BufferGeometry();

    // console.log("this.h.length ", this.h.length); // 404604
    // console.log("this.r.length ", this.r.length); // 1213812

    /**
     * "Position" attribute is build-in
     * https://threejs.org/docs/#api/en/core/bufferAttributeTypes/BufferAttributeTypes
     */
    bufferGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(this.r, 3)
    );

    // "rndId" attribute is custom, i think means "Render-Id"
    bufferGeometry.setAttribute('rndId', new Float32BufferAttribute(this.h, 1));

    // A material rendered with custom shaders. A shader is a small program written in GLSL that runs on the GPU.
    // combine many objects into a single BufferGeometry in order to improve performane
    //    Combination is done by: new Mesh(geometetry, material);
    this.material = new ShaderMaterial({
      transparent: true,
      uniforms: {
        u_time: { type: 'f', value: 0 } as IUniform<number>,
        u_drag_time: { type: 'f', value: 0 } as IUniform<number>,
        u_resolution: {
          type: 'v2',
          value: new Vector2(),
        } as IUniform<Vector2>,
      },
      vertexShader:
        '\n        uniform float u_time;\n        uniform float u_drag_time;\n        uniform vec2 u_resolution;\n        attribute float rndId;\n        varying float vRndId;\n\n        varying float pct;\n\n        void main() {\n          vRndId = rndId;\n          vec2 st = position.xy/u_resolution;\n\n          pct = min(1.0, u_time / (1000. / max(0.2, 0.2 * sin(fract(rndId)))));\n          float vNormal = rndId + ((1.0 - rndId) * pct);\n          vNormal = rndId + ((1.0 - rndId));\n          vNormal = smoothstep(0., 1.0, vNormal);\n          if (u_drag_time > 0.) {\n            vNormal -= ((sin(u_time / 400.0 * vRndId) + 1.0) * 0.02) * min(1., u_drag_time / 1200.0);\n          }\n          vec4 modelViewPosition = modelViewMatrix * vec4(position, vNormal);\n          gl_Position = projectionMatrix * modelViewPosition;\n        }\n    ',
      fragmentShader:
        `\n        uniform bool u_dragging;\n        uniform float u_time;\n        uniform float u_drag_time;\n        varying float vRndId;\n        varying float pct;\n\n        void main() {\n          float v = sin(u_time / 200.0 * vRndId);\n          float alpha = pct * 0.7 + v * 0.2;
        \n float r = ${this.dotsColors[this.colorName][0]};
        \n float g = ${this.dotsColors[this.colorName][1]};
        \n float b = ${this.dotsColors[this.colorName][2]};
        \n
        \n          float dragDur = 1200.0;\n          vec3 color = vec3(r, g, b);\n          float rInc = min(1.0, u_drag_time / dragDur) * (sin(u_drag_time / (dragDur * 0.5) + 1.0) * 0.1);\n          float gInc = min(1.0, u_drag_time / dragDur) * (sin(u_drag_time / (dragDur * 0.75) - 1.0) * 0.1);\n          float bInc = min(1.0, u_drag_time / dragDur) * (sin(u_drag_time / dragDur) * 0.1);\n          if (u_dragging) {\n            color.r = r + rInc;\n            color.g = g + gInc;\n            color.b = b + bInc;\n          }\n\n          gl_FragColor = vec4(color, alpha);\n        }\n    `,
    });

    this.material.side = DoubleSide;
    const dotsMesh = new Mesh(bufferGeometry, this.material);

    // Invoe Group() function add, for add dotsMesh: Mesh
    this.add(dotsMesh);

    /**
     * https://medium.com/@sidiousvic/how-to-use-shaders-as-materials-in-three-js-660d4cc3f12a
     *
     * A uniform, for our purposes, is a value that we can pass to our shader from our Three.js scene.
     * In our fragment shader, these values are applied uniformly to each fragment or pixel in the screen
     *
     * Simple explaination of uniforms and same code for example on "resolution"
     */
    this.material.uniforms.u_resolution.value.x = window.innerWidth;
    this.material.uniforms.u_resolution.value.y = window.innerHeight;

    // Start calulate DragTime from now and reset
    // NB: performance is Native class
    this.startTime = performance.now();
    this.dragStartTime = 0;

    // Push "globeDots" in loaded array
    this.callback();
  };

  public generateDots = (imageData: ImageData): void => {
    // radius: 574px
    // radius/450: 1.27555 55555555556
    const smallRadiusPart = (this.radius / 450) * 1.8;

    // La densità NON è collegata al numero di pixel bianchi dell'immagine
    const totalDots = this.customDotsDensity
      ? DotsDensity // 20.000
      : 10000 + Math.floor((this.radius / 600) * 70000); // 76.966

    /**
     * CircleGeometry - https://threejs.org/docs/#api/en/geometries/CircleGeometry4
     * radius — Radius of the circle, default = 1.
     * segments — Number of segments (triangles), minimum = 3, default = 8.
     *
     * Creo un cerchio di 6 parti di raggio: smallRadiusPart
     */
    const circleGeometry = new CircleGeometry(smallRadiusPart, 6);

    /**
     * BufferGeometry - https://threejs.org/docs/#api/en/core/BufferGeometry
     */
    const firstBufferGeometry = new BufferGeometry();

    // Initialize empty vetor used for retrive coords
    const vector3 = new Vector3();

    // Create totalDots dots on Sphere (globe) with map image as mask
    for (let i = totalDots; i >= 0; i -= 1) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos?retiredLocale=it
      // The Math.acos() function returns the arccosine (in radians) of a number, that is
      // Radoppio i dot rimanente 2*1, divido per il totale e tolgo 1. Al primo giro avrà - (2 * 70.000) / totalDots(70.000) = 2 = 2-1 = 1;
      const phi = Math.acos((2 * i) / totalDots - 1); // Primo giroè 0

      const teta = Math.sqrt(totalDots * Math.PI) * phi;

      // https://threejs.org/docs/#api/en/math/Spherical
      // phi - polar angle in radians from the y (up) axis. Default is 0.
      // theta - equator angle in radians around the y (up) axis. Default is 0.

      // NB: Credo sia un modo per alternare la posizione dei pallini (ogni giro sono nel punto opposto)
      vector3.setFromSphericalCoords(this.radius, phi, teta);

      // if (i < 5) {
      //   console.log('vector3: ', vector3);
      // }

      // Aggiungo nel buffer per ogni dot una copia di circleGeometry
      // NB: Questo  new BufferGeometry(); serve per storare e ottimizare tutti gli oggetti
      //    e fareil rendere in modo efficente (più di 60k dot (oggetti 2D))
      firstBufferGeometry.copy(circleGeometry);

      // NB: Nella documentazione sconsigliano l'uso di lookAt all'interno di un ciclo
      //    Senza questo durante il Drag ci sono problemi di luce e non si vede nulla
      // Ruota la geometria per affrontare un punto nello spazio.
      firstBufferGeometry.lookAt(vector3);

      // Senza questo funziona non si vede nulla
      firstBufferGeometry.translate(vector3.x, vector3.y, vector3.z);

      // Calcola i bound della sfera
      firstBufferGeometry.computeBoundingSphere();
      if (!firstBufferGeometry.boundingSphere) continue;

      // console.log(
      //   'firstBufferGeometry.boundingSphere.center: ',
      //   firstBufferGeometry.boundingSphere.center
      // );
      // console.log('this.position: ', this.position);

      // If:   W(G(center, position), imageData) > 0
      // Probabilment queste due funzioni servono a capire se stiamo mettendo il pallino nell'area nera della cartina
      // Confermo che imageData.data è un mega array (matrice di colori rgb di ogni pixel dell'immagine) contente due valori "0" area nera e "255" area bianca.
      // Di conseguenza posso sapere sesto piazzando il pallino nella parte bianca (la terra)
      //
      // getImagePixelColor()

      // This.position is always x: 0, y: 0, z: 0

      const dotCoords: Vector2 = getDotCoords(
        firstBufferGeometry.boundingSphere.center,
        this.position
      );
      const imagePixelColor: Uint8ClampedArray = getImagePixelColor(
        dotCoords,
        imageData
      );

      // If RGBA - A is > 0 is white space to fill with our dot geometry!
      if (imagePixelColor[3] > 0) {

        // Questo ciclo for server per aumentare ancora i pallini
        const t = Math.random();
        for (let i = 0; i < 5; i += 1) {
          this.r.push(
            firstBufferGeometry.attributes.position.array[0],
            firstBufferGeometry.attributes.position.array[1],
            firstBufferGeometry.attributes.position.array[2],
            firstBufferGeometry.attributes.position.array[3 + 3 * i],
            firstBufferGeometry.attributes.position.array[4 + 3 * i],
            firstBufferGeometry.attributes.position.array[5 + 3 * i],
            firstBufferGeometry.attributes.position.array[6 + 3 * i],
            firstBufferGeometry.attributes.position.array[7 + 3 * i],
            firstBufferGeometry.attributes.position.array[8 + 3 * i]
          );

          this.h.push(t, t, t);
        }

        this.r.push(
          firstBufferGeometry.attributes.position.array[0],
          firstBufferGeometry.attributes.position.array[1],
          firstBufferGeometry.attributes.position.array[2],
          firstBufferGeometry.attributes.position.array[3],
          firstBufferGeometry.attributes.position.array[4],
          firstBufferGeometry.attributes.position.array[5],
          firstBufferGeometry.attributes.position.array[18],
          firstBufferGeometry.attributes.position.array[19],
          firstBufferGeometry.attributes.position.array[20]
        );

        this.h.push(t, t, t);
      }

    }
  };

  public startDragging = () => {
    this.material &&
      !this.isStatic &&
      ((this.isDragging = !0),
      (this.dragStartTime = performance.now()),
      (this.material.uniforms.u_time.value =
        performance.now() - this.dragStartTime));
  };

  public stopDragging = () => {
    this.isDragging = !1;
  };

  public updateDragTimer = () => {
    this.isDragging
      ? (this.dragTime = performance.now() - this.dragStartTime)
      : this.dragTime > 0.1 &&
        (this.dragTime = Math.max(0, 0.9 * this.dragTime));
  };

  public animate = () => {
    if ((this.updateDragTimer(), !this.material)) return;
    this.material.uniforms.u_drag_time.value = this.dragTime;
    const t = this.isStatic ? 3e3 : performance.now() - this.startTime;
    this.material.uniforms.u_time.value = t;
  };
}

// @TODO - Capire cosa cazzo fanno e spostarle nella classe
function getDotCoords(sphereBound: Vector3, localPosition: Vector3): Vector2 {
  const normalizedVector = new Vector3();

  // .subVectors(a - b): fa la differenza dei tre valori e li settanel nuovo vettore
  // dopo di che normalizzo i valori tra 0 and 1
  normalizedVector.subVectors(localPosition, sphereBound).normalize();

  const s =
    1 -
    (0.5 + Math.atan2(normalizedVector.z, normalizedVector.x) / (2 * Math.PI));

  // Ritorna il valore di un angolo espreso in radianti
  const a = 0.5 + Math.asin(normalizedVector.y) / Math.PI;
  return new Vector2(s, a);
}

// @TODO - Capire cosa cazzo fanno e spostarle nella classe
//
// The underlying pixel data of an area of a <canvas> element. It is created using the ImageData() constructor or creator methods on the CanvasRenderingContext2D object associated with a canvas: createImageData() and getImageData(). It can also be used to set a part of the canvas by using putImageData(). */
//    interface ImageData {
//      Returns the one-dimensional array containing the data in RGBA order, as integers in the range 0 to 255. */
//      readonly data: Uint8ClampedArray;
//    }
function getImagePixelColor(
  t: Vector2,
  imageData: ImageData
): Uint8ClampedArray {
  const imgWidth = imageData.width;
  const imgHeight = imageData.height;

  const a =
    4 * Math.floor(t.x * imgWidth) +
    Math.floor(t.y * imgHeight) * (4 * imgWidth);
  return imageData.data.slice(a, a + 4);
}

export default GlobeDotsGroup;

