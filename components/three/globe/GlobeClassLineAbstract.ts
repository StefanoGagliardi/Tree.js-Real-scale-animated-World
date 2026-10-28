import { Group, Texture } from 'three';

/**
 * Abstraction for class deputated to draw animated line across globe
 * Class tructure is similar to GlobeClassDots, abstract class extends Three.js Group
 */
abstract class GlobeClassLineAbstract extends Group {

  /**
   * Counter of frames
   */
  public animationFrame: number;

  /**
   * Non capisco perchè non fare dei metodi
   */
  public drawAnimatedLine!: () => void;
  public drawStaticLine!: () => void;
  public eraseLine!: () => void;

  public active: any;
  public geometry: any;
  public startTime: any;
  public material: any;
  public circle1: any;
  public circle2: any;
  public colors: any;
  public texture: any;
  public isStatic: any;
  public startLat: any;
  public startLng: any;
  public mesh: any;
  public circleMaterial1: any;
  public circleMaterial2: any;
  public circleGeometry: any;

  constructor(
    countryCoord: [number, number],
    liveCountryCoord: [number, number],
    color: [number, number],
    arcTextures: Texture,
    circleTexture: Texture,
    arcRadius: number,
    isStatic: boolean
  ) {

    // Initialize Group()
    super();

    this.animationFrame = 0;
  }
}

export default GlobeClassLineAbstract;
