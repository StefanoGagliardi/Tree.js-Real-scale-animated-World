import {
  AmbientLight,
  PointLight,
  Group,
  ImageLoader,
  Vector3,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  OrthographicCamera,
  TextureLoader,
} from 'three';
import GlobeDotsGroup from './GlobeClassDots';
import DrawLinesClass from './GlobeClassLine';
import GlobeClassAbstract from './GlobeClassAbstract';
import { LoadingPhase } from './GlobeTypes';
import {
  ConvToDegree,
  ConvToRadia,
  CountryCoords,
  Easing,
  PiMezzi,
  Timing,
} from './GlobeHelpers';
import { getWebSiteUrl } from '@config/site';

const U = 2 * Math.PI,
  Q = -0.5 * Math.PI,
  B = 0.25 * Math.PI,
  arcTexture = [
    `${getWebSiteUrl()}/globe/arc-texture-1.png`,
    `${getWebSiteUrl()}/globe/arc-texture-2.png`,
    `${getWebSiteUrl()}/globe/arc-texture-3.png`,
    `${getWebSiteUrl()}/globe/arc-texture-4.png`,
  ];

/**
 * Stripe example are saved on Desktop under: StripeGlobe, anyway js link are:
 * https://b.stripecdn.com/mkt-statics-srv/assets/three.module-cce081bf.js
 * https://b.stripecdn.com/mkt-statics-srv/assets/Globe-8fa16036.js
 * https://b.stripecdn.com/mkt-statics-srv/assets/BackgroundGlobe-cbd39de9.js
 * https://b.stripecdn.com/mkt-statics-srv/assets/Timing-2d7f1e43.js
 * https://b.stripecdn.com/mkt-statics-srv/assets/Numbers-2e7e0986.js
 * https://b.stripecdn.com/mkt-statics-srv/assets/Easings-4d119de0.js
 */

/**
 * Vista la grande quantità di proprietà e di metodi, una classe astratta èa perfetta per lo scopo.
 */
export class GlobeClass extends GlobeClassAbstract {
  constructor(ele: HTMLDivElement) {
    // Initialize class property
    super(ele);

    // Initialize class property functions
    this.initializeInteractionEvents();
  }

  /**
   * Initialize class property with function for handle User or Device (resize)
   * interaction: resize, drag, touch, mouse.
   *
   * @TODO Controllare le funzioni dichiarate alla fin del giro (quando registro i lisetener)
   */
  public initializeInteractionEvents = (): void => {
    // Used in this.handleMouseDown()
    this.handleDragStart = () => {
      this.globeDots.startDragging(),
        (this.isDragging = !0),
        (this.oldRotationX = this.globeContainer.rotation.x),
        (this.oldRotationY = this.globeContainer.rotation.y),
        (this.targetScale = this.isStatic ? 1 : 0.98),
        document.documentElement.classList.add('is-globe-dragging');
    };

    // Used in this.handleResize() and this.load()
    this.setWindowSize = () => {
      (this.windowW = document.documentElement.clientWidth),
        (this.windowH = this.el.offsetHeight),
        (this.aspectRatio = this.windowW / this.windowH),
        this.renderer.setSize(this.windowW, this.windowH),
        (this.oldInnerWidth = this.windowW);
    };

    // Used in event listener (triggered by devie)
    this.handleResize = () => {
      const t = document.documentElement.clientWidth;
      (this.oldInnerWidth !== t || t > 512) &&
        (this.setWindowSize(), this.addCamera());
    };

    // User interaction
    this.handleMouseUp = () => {
      setTimeout(() => {
        document.documentElement.classList.remove('is-globe-dragging');
      }, 20),
        (this.isDragging = !1),
        (0 !== this.moveX || Math.abs(this.moveY) > 0) &&
          this.throwGlobe(this.moveX, this.moveY),
        (this.oldMouseX = 0),
        (this.oldMouseY = 0),
        (this.moveX = 0),
        (this.moveY = 0),
        (this.targetScale = 1),
        this.globeDots.stopDragging();
    };

    // User interaction
    this.handleMouseMove = (t: MouseEvent) => {
      (this.mouse.x = t.clientX),
        (this.mouse.y = t.clientY),
        this.handleDragging();
    };

    // User interaction
    this.handleMouseDown = (t: MouseEvent) => {
      document.documentElement.classList.add('is-globe-dragging'),
        (this.oldMouseX = t.clientX),
        (this.oldMouseY = t.clientY),
        this.handleDragStart();
    };

    // User interaction
    this.handleTouchStart = (t: TouchEvent) => {
  const i = t.touches[0] || t.changedTouches[0];
  (this.oldMouseX = i.pageX),
    (this.oldMouseY = i.pageY),
    (this.mouse.x = i.pageX),
    (this.mouse.y = i.pageY),
    (this.touchStartX = i.pageX),
    (this.touchStartY = i.pageY),
    this.handleDragStart();
};
    // User iteraction
    this.handleTouchMove = (t: TouchEvent) => {
  const i = t.touches[0] || t.changedTouches[0];
  (this.touchDistanceX = Math.abs(this.touchStartX - i.pageX)),
    (this.touchDistanceY = Math.abs(this.touchStartY - i.pageY)),
        this.touchDistanceY > this.touchDistanceX ||
          ((this.mouse.x = i.pageX),
          (this.mouse.y = i.pageY),
          this.handleDragging());
    };

    // Used in: this.handleTouchMove() and  this.handleMouseMove()
    this.handleDragging = () => {
      this.isDragging &&
        ((this.tension = 1 + Math.abs(this.oldRotationX)),
        (this.tension **= this.tension),
        (this.moveX = -0.003 * (this.oldMouseX - this.mouse.x)),
        (this.moveY =
          (-0.003 * (this.oldMouseY - this.mouse.y)) / this.tension),
        (this.newRotationY = this.resetRevolutions(
          this.oldRotationY + this.moveX
        )),
        (this.newRotationX = Math.max(
          Q,
          Math.min(B, this.oldRotationX + this.moveY)
        )),
        (this.globeContainer.rotation.y = this.newRotationY),
        (this.globeContainer.rotation.x = this.newRotationX),
        (this.oldRotationY = this.newRotationY),
        (this.oldRotationX = this.newRotationX),
        (this.oldMouseX = this.mouse.x),
        (this.oldMouseY = this.mouse.y));
    };
  };

  /**
   * Entry function for build WebGL Scene, object and then render
   */
  public load = (): boolean => {
    // Set "scene" like current phase loading
    this.loading.push('scene');

    // Set Height to canvas div container with same of window
    this.el.style.height = window.outerHeight.toString() + 'px';

    /**
     *  Create WebGL (Globe) object, light, scene, camera
     */
    // Set screen render property and append Canvas
    this.addRenderer();

    // Add Lightining to scene
    // NB: L'illuminazione viene settata prima ma durante lo sviluppo l'avrà fatta dopo la creazione del globo
    //      e poi spostato il codice per il render (oppure ha creato il metodo ma l'ha )
    this.addLighting();

    // Add globe object
    this.addGlobe();

    // Add Listener for user or device interaction
    this.addListeners();

    // Set windows size and render size based on user client
    this.setWindowSize();

    // Add camera (point of view) for render
    this.addCamera();

    // PUsh Three.js scene as loaded
    this.objectLoaded('scene');

    return true;
  };

  /**
   * Generate WebGL Render object and append generated canvas
   * https://threejs.org/docs/#api/en/renderers/WebGLRenderer
   */
  public addRenderer = (): void => {
    // this.renderer = new WebGLRenderer({ antialias: !1, alpha: !0 });

    // Sets device pixel ratio. This is usually used for HiDPI device to prevent bluring output canvas.
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Sets the clear color and opacity:color and alpha (0)
    // @see for color number conversion - https://github.com/mrdoob/three.js/blob/dev/src/math/Color.js
    this.renderer.setClearColor(14540253, 0); // Understand if 14540253 is HEX Color

    // Defines whether the renderer should sort objects. Default is true.
    this.renderer.sortObjects = false;

    // Append <Canvas> to container div. Function appendChild() are native of HTMLElement
    // From Three.js documentation: A canvas where the renderer draws its output.
    this.dom.appendChild(this.renderer.domElement);
  };

  /**
   * Add lighting to three.js scene:
   * AmbientLight: https://threejs.org/docs/#api/en/lights/AmbientLight
   * This light globally illuminates all objects in the scene equally.
   * PointLight: https://threejs.org/docs/#api/en/lights/PointLight
   * A light that gets emitted from a single point in all directions. A common use case for this is to replicate the light emitted from a bare lightbulb.
   */
  public addLighting = (): void => {
    const GlobalLight = new AmbientLight(10086140, 1); // new AmbientLight(Color, Alpha);
    // @see https://github.com/mrdoob/three.js/blob/dev/src/math/Color.js
    // b: 0.9882352941176471
    // g: 0.9019607843137255
    // r: 0.6

    // Add global light to Scene
    this.scene.add(GlobalLight);

    const FirstPointLight: PointLight = new PointLight(12775677, 2, 0, 2);
    FirstPointLight.position.set(-1000, -1100, -3300);
    this.scene.add(FirstPointLight);

    const SecondPointLight = new PointLight(10593711, 0.8, 0, 20);
    SecondPointLight.position.set(-3000, 3000, 3300); // 3e3 = 3 * Math.pow(10,3) = 3000
    this.scene.add(SecondPointLight);
  };

  /**
   * Create new Three.js Group and add map, dot and fill.
   */
  public addGlobe = (): void => {
    // New Three container for Globe
    this.globeContainer = new Group();

    // Add object group to scene
    this.scene.add(this.globeContainer);

    // New three container for map image mask
    this.globeMap = new Group();

    // Add globeMap container to main globeContainer
    this.globeContainer.add(this.globeMap);

    // 1. Create map mask on sphere with world B/W image.
    // 2. Then replace Black section of mask with custom (dot) texture
    this.addGlobeDots();

    // Set globe color fill
    if (!this.disableGlobeFill) {
      this.addGlobeFill();
    }

    /**
     * Set container position
     */
    this.setGlobeContainerPosition();
  };

  /**
   * Set position of Globe container inside Scene (x,y,z)
   */
  public setGlobeContainerPosition = (): void => {
    // Container z = 2 volte raggio
    this.globeContainer.position.z = 2 * -this.globeRadius;

    // Container x = 1 decimo del PI
    // 0.1111 * Pi, probabilmente è un valore a manella per centrare il globo come si preferisce
    this.globeContainer.rotation.x = 0.1111 * Math.PI;

    // Container y based on static
    if (this.isStatic) {
      this.globeContainer.rotation.y = 0.1 * Math.PI;
    } else {
      this.globeContainer.rotation.y = Math.PI;
    }
  };

  /**
   * This fuction create custom class that extende Three.js Group.
   * So create a three group with some additional operation:
   * 1. Create map mask on sphere with world B/W image.
   * 2. Then replace Black section of mask with custom (dot) texture
   */
  public addGlobeDots = (): void => {
    // Set "globeDots" as loading Phase
    this.loading.push('globeDots');

    this.globeDots = new GlobeDotsGroup(this.globeRadius, this.isStatic, () => {
      this.objectLoaded('globeDots');
    });

    // Add Custom (extended) group to scene
    this.globeMap.add(this.globeDots);
  };

  /**
   * Creo una sfera appena appena più piccola del globo con un background
   * cosi da riempire gli spazi senza i pallini e sopratutto
   * PER DARE PROFONDITA ALLA SFERA TRAMITE LA LUCE e IL COLORE DIVERSO DAL BG DELLA SEZIONE
   * NB: Opacità initialmente viene settata a 0 e poi cambiata nel metodo: revealAnimation()
   */
  public addGlobeFill = (): void => {
    this.globeFillMaterial = new MeshLambertMaterial({
      transparent: !0,
      opacity: 0,
      color: 1056824,
    });

    this.globeFillSphere = new SphereGeometry(
      this.globeRadius - 0.1,
      this.globeSegments,
      this.globeSegments
    );

    this.globeFill = new Mesh(this.globeFillSphere, this.globeFillMaterial);
    this.globeMap.add(this.globeFill);
  };

  /**
   * Push phase to already loaded object, if loaded length is same of total phase
   * se global parametry: isLoaded = true
   */
  public objectLoaded = (loadedObject: LoadingPhase = 'x'): void => {
    this.loaded.push(loadedObject);

    if (this.loaded.length === this.loading.length) {
      this.isLoaded = true;
    }
  };

  /**
   * Add Event listener for user interactions
   */
  public addListeners = (): void => {
    window.addEventListener('resize', this.handleResize),
      this.isStatic ||
        (window.addEventListener('mouseup', this.handleMouseUp),
        window.addEventListener('mousemove', this.handleMouseMove),
        this.el.addEventListener('touchstart', this.handleTouchStart, {
          passive: !0,
        }),
        window.addEventListener('touchmove', this.handleTouchMove),
        window.addEventListener('touchend', this.handleMouseUp),
        this.el.addEventListener('mousedown', this.handleMouseDown));
  };

  /**
   * Add camera for user poit of view
   * https://threejs.org/docs/?q=OrthographicCamera#api/en/cameras/OrthographicCamera
   */
  public addCamera = (): void => {
    const positionY = 0.5 * this.windowH;
    const positionX = -this.aspectRatio * this.windowH * 0.5;
    const fourRadius = 4 * this.globeRadius;
    this.camera = new OrthographicCamera(0, 0, 0, 0, 0, 0);
    this.camera.left = positionX;
    this.camera.right = -positionX;
    this.camera.top = positionY;
    this.camera.bottom = -positionY;
    this.camera.near = -fourRadius;
    this.camera.far = fourRadius;

    // Shift camera and update projection
    this.shiftCamera();
    this.camera.updateProjectionMatrix();
  };

  /**
   * Shift camera
   */
  public shiftCamera = (): void => {
    const shiftVal = 1.05 * -this.globeRadius;
    this.camera.position.x = shiftVal;
    this.camera.position.y = 0.2 * this.globeRadius;
  };

  /**
   * This funciton is invoked when load in ended then:
   * 1. Start Globe render
   * 2. @TODO DEBUG - Draw line across globe
   */
  public play = (): void => {
    // Fintanto che non ho aggiunto delle linee NON è inizializzato
    if (
      this.initialized &&
      !this.isStatic &&
      this.disableGlobeLines === false
    ) {
      this.currentLines.forEach((t) => t.play());
      this.drawLines();
    } else {
      // @TODO Finire il punto da qui in avanti
      if (!this.disableGlobeLines) {
        this.addLines();
      }

      if (!this.initialized || !this.isStatic) {
        // One time is here, after first render() invoke, this function is recursive.
        this.render(this.frame);

        // Set initialized status
        this.initialized = true;
      }
    }
  };

  /**
   * Render scene and each frame
   */
  public render = (frameIndex: number = 0): void => {
    this.frame = frameIndex;
    this.autoRotateGlobe();

    if (Math.abs(this.scale - this.targetScale) > 0.001) {
      this.scale -= 0.1 * (this.scale - this.targetScale);
      if (!this.disableGlobeFill) {
        this.globeFill.scale.set(this.scale, this.scale, this.scale);
      }
    }

    // Animate dots
    if (!this.globeOff && this.isLoaded) {
      this.globeDots?.animate();
    }

    // If not revealed world start reveal animation
    this.isRevealed || this.revealAnimation();

    // Render scene and camera
    this.renderer.render(this.scene, this.camera);

    // Render new Frame
    this.renderAnimationFrame = requestAnimationFrame(() => {
      if (
        this.isRevealed &&
        this.isStatic &&
        this.arcTexturesLoaded === arcTexture.length &&
        this.isDiscTextureLoaded
      ) {
        this.renderer.render(this.scene, this.camera);
      } else {
        // If not static always drop here and invoke self
        this.render(frameIndex + 1);
      }
    });
  };

  /**
   * Set corret globe rotation
   */
  public autoRotateGlobe = (): void => {
    this.isDragging ||
      this.isScrolling ||
      this.isStatic ||
      (this.globeContainer.rotation.y -= this.globeRotationIncrement);
  };

  /**
   * Reveal Wordl with easing animation
   */
  public revealAnimation = (): void => {
    let animationDelta: number = Easing.easeOutQuart(
      this.globeOpacity,
      0,
      1,
      1
    );

    if (this.isStatic) {
      animationDelta = 1;
    }

    this.globeOpacity += 0.005;

    // Set opacity to Background Sphere generated b addGlobeFill
    if (!this.disableGlobeFill) {
      this.globeFillMaterial.opacity = 0.94 * animationDelta;
    }

    this.globeRotationIncrement =
      0.02 * (1 - animationDelta) + 0.001 * animationDelta;
    if (animationDelta > 0.999) {
      this.isRevealed = true;
    }
  };

  /**
   * When user Drag set smooth effect and inertial
   */
  public throwGlobe = (t: number, i: number): void => {
    const e = 0.94 * t,
      s = 0.94 * i,
      a = this.globeContainer.rotation.y + e,
      n = Math.max(Q, Math.min(B, this.globeContainer.rotation.x + s));
    (this.globeContainer.rotation.y = this.resetRevolutions(a)),
      (this.globeContainer.rotation.x = n),
      (Math.abs(e) > 0.001 || Math.abs(s) > 0.001) &&
        !1 === this.isDragging &&
        (this.throwAnimationFrame = requestAnimationFrame(() => {
          this.throwGlobe(e, s);
        }));
  };

  /**
   * Set CountryList for lines link from external
   */
  public setCountryList = (countryList: string[]): void => {
    this.countryList = countryList;
  };

  /**
   * Reset globe revolution
   */
  public resetRevolutions = (rotationY: number): number => {
    if (0 === Math.abs(rotationY / U)) return rotationY;
    return (
      rotationY - Math.floor(Math.abs(rotationY / U)) * Math.sign(rotationY) * U
    );
  };

  // ================ Animated Lines Functions =================

  /**
   * At first render (not static) invoke this function for add lines. Call by play()
   * Move to Class GlobeClassLine()?
   */
  public addLines = (): void => {
    // Load circle texture image
    this.circleTexture = new TextureLoader().load(
      `${getWebSiteUrl()}/globe/disc_texture.png`,
      () => {
        this.isDiscTextureLoaded = true;
      }
    );

    // Load four type of texture for arc across two circle
    this.arcTextures = arcTexture.map((t) => {
      return new TextureLoader().load(t, () => {
        this.arcTexturesLoaded += 1;
      });
    });

    // Questo è corretto in quanto facciolo stesso con globeMap
    this.linesContainer = new Group();
    this.globeContainer.add(this.linesContainer);

    this.drawLines();
  };

  /**
   * Draw lines is a switcher for static or non-static option.
   * 1. Static: draw 5 line one time, invoke drawLine() five time in one cycle
   * 2. Non-static: set interval each second call drawLine()
   */
  public drawLines = (): void => {
    // Se NON-STATIC setto l'animazone infinita
    if (!this.isStatic) {
      clearInterval(this.lineInterval);
      this.lineInterval = setInterval(() => {
        // Ogni secondo cade sempree solo qui
        this.drawLine();
      }, 1000);
      return;
    }

    // Static CASE
    // Cado qui solo se il Globo è statico e disegno 5 linee
    if (0 === this.lineCount) {
      for (let t = 0; t < 5; t += 1) {
        this.drawLine();
      }
    }
  };

  /**
   * Draw and set animation for single line object
   */
  public drawLine = (): void => {
    // Increase active
    this.lineCount += 1;

    const globeRotationY = this.resetRevolutions(
      this.globeContainer.rotation.y
    );

    // Get first country to link in list based to total lines count
    let countryListPair =
      this.countryList[this.lineCount % this.countryList.length];

    // Get second country to link in list based to total lines count
    let liveCountryListPair =
      this.liveCountryList[this.lineCount % this.liveCountryList.length];

    // IN base alla rotazione y del globo setto la direzione
    // Per ogni coppia controllo che sia dentro la parte visibile

    //   if (
    //     ((t < 5.7 && t > 4.4) || (t > -2 && t < -0.2)
    //         ? (s = this.eastCountryList[this.lineCount % this.eastCountryList.length])
    //         : (t < 4.2 && t > 2.2) || (t > -4 && t < -1.7)
    //         ? (((t < -1.7 && t > -3) || (t > 3 && t < 4.2)) && (e = this.eastCountryList[this.lineCount % this.eastCountryList.length]), (s = this.westCountryList[this.lineCount % this.westCountryList.length]))
    //         : ((t < 2.2 && t > 0.3) || (t > -6.28 && t < -4)) && (s = this.middleCountryList[this.lineCount % this.middleCountryList.length]),
    //     e === s)
    // )
    //     return void this.drawLine();

    if (
      ((globeRotationY < 5.7 && globeRotationY > 4.4) ||
      (globeRotationY > -2 && globeRotationY < -0.2)
        ? (liveCountryListPair =
            this.eastCountryList[this.lineCount % this.eastCountryList.length])
        : (globeRotationY < 4.2 && globeRotationY > 2.2) ||
          (globeRotationY > -4 && globeRotationY < -1.7)
        ? (((globeRotationY < -1.7 && globeRotationY > -3) ||
            (globeRotationY > 3 && globeRotationY < 4.2)) &&
            (countryListPair =
              this.eastCountryList[
                this.lineCount % this.eastCountryList.length
              ]),
          (liveCountryListPair =
            this.westCountryList[this.lineCount % this.westCountryList.length]))
        : ((globeRotationY < 2.2 && globeRotationY > 0.3) ||
            (globeRotationY > -6.28 && globeRotationY < -4)) &&
          (liveCountryListPair =
            this.middleCountryList[
              this.lineCount % this.middleCountryList.length
            ]),
      countryListPair === liveCountryListPair)
    ) {
      return void this.drawLine();
    }

    const countryCoord = CountryCoords[countryListPair],
      liveCountryCoord = CountryCoords[liveCountryListPair],
      colorIndex = this.lineCount % this.arcColors.length,
      arcColor = this.arcColors[colorIndex];

    const drawedLineObject = new DrawLinesClass(
      countryCoord, // [number, number]
      liveCountryCoord, // [number, number]
      arcColor, // [number, number]
      this.arcTextures[colorIndex as any], // Array with 4 element image
      this.circleTexture,
      1.001 * this.globeRadius + 0.01 * Math.random(),
      this.isStatic
    );

    // Add line to container
    this.linesContainer.add(drawedLineObject);

    // Push current line in internal state
    this.currentLines.push(drawedLineObject);

    // Se non è statico setto un delay che dopo 1 secondo invoca la funzione
    // hideLine() passando oggetto Linea
    this.isStatic ||
      Timing.delay(() => {
        // Hide line
        this.hideLine(drawedLineObject);
        // Found line index and remove, until recreation on next cycle
        const lineIndex = this.currentLines.indexOf(drawedLineObject);
        if (lineIndex > -1) {
          this.currentLines.splice(lineIndex, 1);
        }
      }, 1000); // 4e3
  };

  /**
   * Hide, dispose and remove line:
   * 1. Invoke hideLine() from class GlobeClassLine
   * 2. Invoke disposeLine() from class GlobeClassLine
   * 3. Remove current object line from lineContainers (three Group)
   */
  public hideLine = (DrawLineClass: DrawLinesClass): void => {
    // Hide line
    DrawLineClass.hideLine();

    // After 1,5s dispose line material and
    // remove from this.linesContainer (Three.js Group class)
    Timing.delay(() => {
      DrawLineClass.disposeLine();
      this.linesContainer.remove(DrawLineClass);
    }, 1500);
  };
}

/**
 * Calculate position for start line country
 * @returns
 */
export function coordsToVector3D(
  lat: number,
  lng: number,
  radius: number
): Vector3 {
  const s = (90 - lat) * ConvToRadia,
    a = lng * ConvToRadia;

  return new Vector3(
    -radius * Math.sin(s) * Math.cos(a),
    radius * Math.cos(s),
    radius * Math.sin(s) * Math.sin(a)
  );
}

export default GlobeClass;
