/**
 * Abstract class for Map mask and dots texture.
 * This class initial extends Three.js class "Group"
 */

import { Group, ShaderMaterial } from 'three';
import { CUSTOM_DOTS_DENSITY } from './GlobeConfig';
import { VoidCallback } from './GlobeTypes';

abstract class GlobeClassDotsAbstract extends Group {
  /**
   * This function is invoke when globe dots end, this calback emit completed event to parant class
   * via
   */
  public callback: VoidCallback;

  /**
   * Sphere radius (based on device (30%) + 250)
   */
  public radius: number;

  /**
   * Set if render static globe image
   */
  public isStatic: boolean;

  /**
   * @TODO Array to undersand
   */
  public r: any[];

  /**
   * @TODO Array to undersand
   */
  public h: any[];

  /**
   * Set if render static globe image
   */
  public customDotsDensity: boolean;

  /**
   * Show if is active dragging
   */
  public isDragging: boolean;

  /**
   * Material used
   */
  public material!: ShaderMaterial;

  /**
   * Start time is performane.now()
   */
  public startTime: number;

  /**
   * When set startTime, reset dragStartTime to 0
   */
  public dragStartTime: number;

  /**
   * Difference between startTime and another perfomance.now()
   * give as a result: dragTime
   */
  public dragTime: number;

  constructor(radius: number, isStatic: boolean, callback: VoidCallback) {
    // Initializa Group()
    super();

    // Initialize class property
    this.callback = callback;
    this.isStatic = isStatic;
    this.radius = radius;
    this.rotation.x = -Math.PI;
    this.rotation.z = -Math.PI;
    this.customDotsDensity = CUSTOM_DOTS_DENSITY;
    this.isDragging = false;
    // this.material = {};
    this.startTime = 0;
    this.dragStartTime = 0;
    this.dragTime = 0;
    this.r = [];
    this.h = [];
  }

  /**
   * Load image and create SPhere with image mask
   * Then texturie image with other (smaller) image: dots textureF
   */
  abstract loadMapImage: () => void;

  /**
   * When map image is loaded and ready to use.
   * NB: ImageData is a Type returned by canvas.getContext2D().getImageData()
   *     imageData returned from getImageData() contain "data" that is one dimensional array color rgba
   *
   * @see ImageData.data interface for understand
   */
  abstract mapLoaded: (imageData: ImageData) => void;

  /**
   * Inside mapLoaded this functions generate texture object "dot" to cover all white space in map
   */
  abstract generateDots: (imageData: ImageData) => void;
}

export default GlobeClassDotsAbstract;
