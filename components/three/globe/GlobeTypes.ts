import { Group, Scene, Vector2, WebGLRenderer } from 'three';

export type LoadingPhase = 'scene' | 'globeDots' | 'x';

import type GlobeDotsGroup from './GlobeClassDots';

export default interface GlobeClassInterface {
  /**
   * Array with loading phase
   */
  loading: LoadingPhase[];

  /**
   * HTML Element container for append Canvas
   */
  el: HTMLElement;

  /**
   * DOM Html element
   */
  dom: HTMLElement;

  /**
   * Define if canvas enable animation and user interations
   * For debug is use111111full set this to true for stop frame render and too much log print
   */
  isStatic: boolean;

  /**
   * For debug reason disable addGlobeFill() - Sphere Background and depth
   */
  disableGlobeFill: boolean;

  /**
   * For debug reason disable functions for add and render lines across country
   */
  disableGlobeLines: boolean;

  /**
   * Mouse property is a 2D Vector - https://threejs.org/docs/#api/en/math/Vector2
   * Is a ordered Pair of numbers; used e.g:
   *  1. point on 2D space
   *  2. define [Direction, length] - Length will always be the Euclidean distance
   *  3. Simple number pair store
   */
  mouse: Vector2;

  /**
   * Three WebGLRendere Object - https://threejs.org/docs/#api/en/renderers/WebGLRenderer
   * The WebGL renderer displays your beautifully crafted scenes using WebGL.
   */
  renderer: WebGLRenderer;

  /**
   * Three Scene Object - https://threejs.org/docs/#api/en/scenes/Scene
   * Scenes allow you to set up what and where is to be rendered by three.js.
   * This is where you place objects, lights and cameras.
   */
  scene: Scene;

  /**
   * Three.js Group (Object3D) - https://threejs.org/docs/#api/en/core/Object3D Explainaion difference with Group
   * Its purpose is to make working with groups of objects syntactically clearer.
   */
  globeContainer: Group;

  /**
   * Three.js Group container for Globe Map Mask
   */
  globeMap: Group;

  /**
   * Globe, sphere radius (Raggio sfera nel canvas):
   * 1. uso la width dell'utente con un massimo di 1080
   * 2. Prendo il 30%
   * 3. Aggiungo 250px;
   *
   * r = min(clientWidth, 1080) * 0.3 + 250
   */
  globeRadius: number;

  /**
   * This is a class that extend Three.js Group for map dots Object
   */
  globeDots: GlobeDotsGroup;

  /**
   * Loaded object
   */
  loaded: LoadingPhase[];

  /**
   * Loading sttus of currentObject in loading
   */
  isLoaded: boolean;

  /**
   * Initialize property with function for handle interactions: drag, resize, touch, mouse
   */
  initializeInteractionEvents: () => void;

  /**
   * Entry function for build WebGL Scene, object and then render
   */
  load: () => boolean;

  /**
   * Set screen render property (pixelRation, clearColor) and append Canvas
   */
  addRenderer: () => void;

  /**
   * Add lighting to three.js scene:
   * AmbientLight: https://threejs.org/docs/#api/en/lights/AmbientLight
   * PointLight: https://threejs.org/docs/#api/en/lights/PointLight
   */
  addLighting: () => void;

  /**
   * Create new Three.js Group and add map, dot and fill.
   * Generate new Group() and add to scene
   */
  addGlobe: () => void;

  /**
   * This fuction create custom class that extende Three.js Group.
   * So create a three group with some additional operation:
   * 1. Create map mask on sphere with world B/W image.
   * 2. Then replace Black section of mask with custom (dot) texture
   */
  addGlobeDots: () => void;

  /**
   * Creo una sfera appena appena più piccola del globo con un background
   * cosi da riempire gli spazi senza i pallini e sopratutto
   * PER DARE PROFONDITA ALLA SFERA TRAMITE LA LUCE e IL COLORE DIVERSO DAL BG DELLA SEZIONE
   */
  addGlobeFill: () => void;

  /**
   * Set position of Globe container inside Scene (x,y,z)
   */
  setGlobeContainerPosition: () => void;
}

export type VoidCallback = () => void;

// Uncomment after addGlobalFill refactorin:
// public render ->   this.globeFill.scale.s
// public revealAnimation -> this.globeFillMaterial.opacit
