import { Group, Scene, Texture, Vector2, Vector3, WebGLRenderer } from 'three';
import GlobeClassInterface, { LoadingPhase } from './GlobeTypes';
import { CountryCoords } from './GlobeHelpers';
import { DISABLE_FILL, DISABLE_LINES, IS_STATIC } from './GlobeConfig';
import DrawLinesClass from './GlobeClassLine';
import type GlobeDotsGroup from './GlobeClassDots';

/**
 * Abstract class - https://www.tutorialsteacher.com/typescript/abstract-class
 * Partial implementation of function or abstract declaration.
 */
abstract class GlobeClassAbstract implements GlobeClassInterface {
  /**
   * Array with loading phase
   */
  public loading: LoadingPhase[];

  /**
   * HTML Element container for append Canvas
   */
  public el: HTMLElement;

  /**
   * DOM Html element
   */
  public dom: HTMLElement;

  /**
   * Define if canvas enable animation and user interations
   * For debug is usefull set this to true for stop frame render and too much log print
   */
  public isStatic: boolean;

  /**
   * For debug reason disable addGlobeFill() - Sphere Background and depth
   */
  public disableGlobeFill: boolean;

  /**
   * For debug reason disable functions for add and render lines across country
   */
  public disableGlobeLines: boolean;

  /**
   * Mouse property is a 2D Vector - https://threejs.org/docs/#api/en/math/Vector2
   * Is a ordered Pair of numbers; used e.g:
   *  1. point on 2D space
   *  2. define [Direction, length] - Length will always be the Euclidean distance
   *  3. Simple number pair store
   */
  public mouse!: Vector2;

  /**
   * WebGL Renderer - https://threejs.org/docs/#api/en/renderers/WebGLRenderer
   * The WebGL renderer displays your beautifully crafted scenes using WebGL.
   * Istanziato in GlobeClass.addRenderer() tramite: new WebGLRenderer({ antialias: false, alpha: true })
   */
  public renderer!: WebGLRenderer;

  /**
   * Three.js Scene - https://threejs.org/docs/#api/en/scenes/Scene
   * Definisce il contenitore per tutti gli oggetti, le luci e le camere della scena 3D.
   * Istanziata in GlobeClass.addRenderer() tramite: new Scene()
   */
  public scene!: Scene;

  /**
   * Three container for all scene Object
   */
  public globeContainer!: Group;

  /**
   * Three object container for Globe Map Mask
   */
  public globeMap!: Group;

  /**
   * This is a class that extend Three.js Group for map dots Object
   */
  public globeDots!: GlobeDotsGroup;

  /**
   * Globe, sphere radius (Raggio sfera nel canvas):
   * 1. uso la width dell'utente con un massimo di 1080
   * 2. Prendo il 30%
   * 3. Aggiungo 250px;
   *
   * r = min(clientWidth, 1080) * 0.3 + 250
   */
  public globeRadius: any;

  /**
   * Store loaded Phase
   */
  public loaded: LoadingPhase[];

  /**
   *  Loading sttus of currentObject in loading
   */
  public isLoaded: boolean;
  public globeFillMaterial: any;
  public globeFillSphere: any;
  public globeFill: any;
  public europeBorders: any;
  public globeSegments: any;
  public windowW: any;
  public windowH: any;
  public aspectRatio: any;
  public oldInnerWidth: any;
  public camera: any;
  public initialized: any;
  public currentLines: any[];
  public frame: any;
  // public arcTexturesLoaded: any;
  // public arcTextures: any;
  // public linesContainer: any;
  // public lineCount: any;
  public eastCountryList: any[];
  public westCountryList: any[];
  public middleCountryList: any[];
  public liveCountryList: any[];
  public countryList: any;
  public origin: any;
  public lineInterval: any;
  public arcColors: any[];
  public isDragging: any;
  public isScrolling: any;
  public globeRotationIncrement: any;
  public scale: any;
  public targetScale: any;
  public globeOff: any;
  public globeOpacity: any;
  public isRevealed: any;
  public renderAnimationFrame: any;
  public scrollTop: any;
  public throwAnimationFrame: any;

  public oldMouseX: any;
  public oldMouseY: any;
  public moveX: any;
  public moveY: any;
  public tension: any;
  public oldRotationX: any;
  public oldRotationY: any;
  public newRotationX: any;
  public newRotationY: any;

  public setWindowSize!: () => void;
  public handleResize: any;
  public handleMouseUp: any;
  public handleMouseMove: any;
  public handleDragging: any;
  public handleDragStart: any;
  public handleTouchStart: any;
  public touchStartX: any;
  public touchStartY: any;
  public handleTouchMove: any;
  public touchDistanceX: any;
  public touchDistanceY: any;
  public handleMouseDown: any;

  /**
   * Property for Animated Lines
   */

  /**
   * HTML Image element returned by ImageLoader with circle texture
   */
  public circleTexture!: Texture; //HTMLImageElement;

  /**
   * Flag for loading status of circleTexture
   */
  public isDiscTextureLoaded: boolean;

  /**
   * Array of HTMLImageElement returned by ImageLoader with arc texture
   */
  public arcTextures!: Texture[];

  /**
   * Incremental counter for loading status of 4 arc texture
   */
  public arcTexturesLoaded: number;

  /**
   * Threejs Group as lines container
   */
  public linesContainer!: Group;

  /**
   * Count active line
   */
  public lineCount: number;

  /**
   * Class constructor With HtmlElement container for Canvas
   */
  constructor(ele: HTMLElement) {
    this.loading = [];
    this.dom = ele;
    this.isStatic = IS_STATIC; // DEFAULT: FALSE
    this.disableGlobeFill = DISABLE_FILL; // DEFAULT: FALSE
    this.disableGlobeLines = DISABLE_LINES; // DEFAULT: FALSE
    this.mouse = new Vector2();
    // NOTA: renderer e scene NON vengono istanziati qui.
    // La classe astratta dichiara il contratto (tipo della proprietà),
    // mentre GlobeClass.addRenderer() è responsabile dell'istanziazione concreta:
    //   this.renderer = new WebGLRenderer({ antialias: false, alpha: true })
    //   this.scene    = new Scene()

    // this.globeContainer = new Group(); // = 0
    // this.globeMap = 0;

    // this.globeDots = 0;

    // Prende la width minore tra quella dello schermo e 1080, nei rari casi dove è ma
    // maggiore di HD 1080, tiene 1080 come massimo, a tale width moltiplica per 0.3 ottenendo il 30%
    // della width di partenza e aggiunge 250px.
    // In tal modo l'oggetto Globe non sarà mai troppo grande sulla schermo e sarà
    // sempre ben visibile.
    this.globeRadius =
      250 + 0.3 * Math.min(document.documentElement.clientWidth, 1080);

    this.isLoaded = false;
    this.loaded = [];

    this.globeFillMaterial = 0;
    this.globeFillSphere = 0;
    this.globeFill = 0;
    this.globeSegments = Math.floor((this.globeRadius / 250) * 10) + 20;

    this.windowW = 0;
    this.windowH = 0;
    this.aspectRatio = 0;
    this.oldInnerWidth = 0;

    this.camera = 0;
    this.initialized = false;
    this.currentLines = [];
    this.frame = 0;

    // Line Property
    this.isDiscTextureLoaded = false;
    this.arcTexturesLoaded = 0;
    // this.circleTexture = 0;
    // this.arcTextures = 0;
    // this.linesContainer = 0;
    this.lineCount = 0;

    this.eastCountryList = ['my', 'sg', 'au', 'nz', 'hk', 'jp', 'in'];
    this.westCountryList = ['ca', 'mx', 'us', 'br'];
    this.middleCountryList = [
      'be',
      'gb',
      'at',
      'dk',
      'ee',
      'fi',
      'fr',
      'gr',
      'de',
      'ie',
      'it',
      'lv',
      'lt',
      'lu',
      'nl',
      'no',
      'pl',
      'pt',
      'es',
      'sk',
      'si',
      'se',
      'ch',
      'cy',
      'bg',
      'ro',
      'cz',
    ];
    this.liveCountryList = [
      ...this.eastCountryList,
      ...this.westCountryList,
      ...this.middleCountryList,
    ];
    this.countryList = Object.keys(CountryCoords);
    this.origin = new Vector3(0, 0, 0);
    this.lineInterval = 0;
    this.arcColors = [
      [16335176, 16763735],
      [11232234, 9494783],
      [16335176, 11232234],
      [16763735, 9494783],
    ];
    this.isDragging = false;
    this.isScrolling = false;
    this.globeRotationIncrement = 0.02;
    this.scale = 1;
    this.targetScale = 1;
    this.globeOff = false;
    this.scrollTop = 0;
    this.globeOpacity = 0;
    this.isRevealed = false;
    this.renderAnimationFrame = {};
    this.throwAnimationFrame = 0;

    this.oldMouseX = 0;
    this.oldMouseY = 0;
    this.moveX = 0;
    this.moveY = 0;
    this.tension = 1;
    this.oldRotationY = 0;
    this.oldRotationX = 0;
    this.newRotationY = 0;
    this.newRotationX = 0;
    this.touchDistanceX = 0;
    this.touchDistanceY = 0;

    this.el = ele;
  }

  /**
   * Initialize property with function for handle interactions: drag, resize, touch, mouse
   */
  abstract initializeInteractionEvents: () => void;

  /**
   * Entry function for build WebGL Scene, object and then render
   */
  abstract load: () => boolean;

  /**
   * Set screen render property (pixelRation, clearColor) and append Canvas
   */
  abstract addRenderer: () => void;

  /**
   * Add lighting to three.js scene:
   */
  abstract addLighting: () => void;

  /**
   * Add globe Group (Object3D)
   */
  abstract addGlobe: () => void;

  /**
   * Set position of Globe container inside Scene (x,y,z)
   */
  abstract setGlobeContainerPosition: () => void;

  /**
   * This fuction create custom class that extende Three.js Group.
   * So create a three group with some additional operation:
   * 1. Create map mask on sphere with world B/W image.
   * 2. Then replace Black section of mask with custom (dot) texture
   */
  abstract addGlobeDots: () => void;

  /**
   * Creo una sfera appena appena più piccola del globo con un background
   * cosi da riempire gli spazi senza i pallini e sopratutto
   * PER DARE PROFONDITA ALLA SFERA TRAMITE LA LUCE e IL COLORE DIVERSO DAL BG DELLA SEZIONE
   */
  abstract addGlobeFill: () => void;

  /**
   * Push phase to already loaded object, if loaded length is same of total phase
   * se global parametry: isLoaded = true
   */
  abstract objectLoaded: (loadedObject: LoadingPhase) => void;

  /**
   * REgister event listener on winows for user or device interaction like drag or resize
   */
  abstract addListeners: () => void;

  /**
   * Add camera for user poit of view
   * https://threejs.org/docs/?q=OrthographicCamera#api/en/cameras/OrthographicCamera
   */
  abstract addCamera: () => void;

  /**
   * Add camera for user poit of view
   */
  abstract shiftCamera: () => void;

  /**
   * Start globe remder. easing animation ecc
   */
  abstract play: () => void;

  /**
   * Render scene (frame)
   */
  abstract render: (frameIndex: number) => void;

  /**
   * Set corret globe rotation
   */
  abstract autoRotateGlobe: () => void;

  /**
   * Set corret globe rotation
   */
  abstract revealAnimation: () => void;

  /**
   * When user Drag set smooth effect and inertial
   */
  abstract throwGlobe: (t: number, i: number) => void;

  /**
   * Set CountryList for lines link from external
   */
  abstract setCountryList: (countryList: string[]) => void;

  /**
   * Set CountryList for lines link from external
   */
  abstract resetRevolutions: (rotationY: number) => number;

  // ================ Animated Lines Functions =================

  /**
   * At first render (not static) invoke this function for add lines. Call by play()
   */
  abstract addLines: () => void;

  /**
   * Draw lines is a switcher for static or non-static option.
   * 1. Static: draw 5 line one time, invoke drawLine() five time in one cycle
   * 2. Non-static: set interval each second call drawLine()
   */
  abstract drawLines: () => void;

  /**
   * Draw and set animation for single line object
   */
  abstract drawLine: () => void;

  /**
   * Hide, dispose and remove line:
   * 1. Invoke hideLine() from class GlobeClassLine
   * 2. Invoke disposeLine() from class GlobeClassLine
   * 3. Remove current object line from lineContainers (three Group)
   */
  abstract hideLine: (DrawLineClass: DrawLinesClass) => void;
}

export default GlobeClassAbstract;
