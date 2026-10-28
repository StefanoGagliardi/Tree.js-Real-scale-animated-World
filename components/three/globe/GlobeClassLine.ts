import {
  CubicBezierCurve3,
  Group,
  IUniform,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Texture,
  TubeGeometry,
  Vector3,
} from 'three';
import { coordsToVector3D } from './GlobeClass';
import GlobeClassLineAbstract from './GlobeClassLineAbstract';
import { Easing, Numbers, P } from './GlobeHelpers';

class DrawLinesClass extends GlobeClassLineAbstract {
  constructor(
    countryCoord: [number, number],
    liveCountryCoord: [number, number],
    color: [number, number],
    arcTextures: Texture,
    circleTexture: Texture,
    arcRadius: number,
    isStatic: boolean
  ) {

    // Build abstracvt class and so THreejs Group class 
    super(
      countryCoord,
      liveCountryCoord,
      color,
      arcTextures,
      circleTexture,
      arcRadius,
      isStatic
    );

    // Define sme functions
    this.drawAnimatedLine = () => {
      if (!this.active) return;
      let t = this.geometry.drawRange.count;
      const i = performance.now() - this.startTime;
      this.material.uniforms.u_time.value = i;
      const e = Easing.easeOutQuart(i, 0, 1, 2500);
      if (((t = Math.min(3e3, Math.ceil(3e3 * e))), this.active && t < 3e3)) {
        const i = this.circle1.scale.x;
        if (
          (i < 0.35 && this.circle1.scale.set(i + 0.01, i + 0.01, i + 0.01),
          t > 1500)
        ) {
          const t = this.circle2.scale.x;
          t < 0.35 && this.circle2.scale.set(t + 0.015, t + 0.015, t + 0.015);
        }
        this.geometry.setDrawRange(0, t);
      }
      this.animationFrame = requestAnimationFrame(this.drawAnimatedLine);
    };

    this.drawStaticLine = () => {
      this.geometry.setDrawRange(0, 3e3),
        this.circle1.scale.set(0.35, 0.35, 0.35),
        this.circle2.scale.set(0.35, 0.35, 0.35);
    };

    // When line is complete and need to remove
    this.eraseLine = () => {
      const t = this.geometry.drawRange.count,
        i = this.geometry.drawRange.start;
      if (
        ((this.material.uniforms.u_time.value =
          performance.now() - this.startTime),
        i > t)
      )
        return;
      const e = this.circle1.scale.x,
        s = this.circle2.scale.x;
      if (e > 0.03) {
        const t = e - 0.01;
        this.circle1.scale.set(t, t, t);
      }
      if (i > 1500 && s > 0.03) {
        const t = s - 0.015;
        this.circle2.scale.set(t, t, t);
      }
      this.geometry.setDrawRange(i + 48, t),
        (this.animationFrame = requestAnimationFrame(this.eraseLine));
    };

    // Initialize class property
    this.colors = color;
    this.texture = arcTextures;
    this.isStatic = isStatic;

    // FIrst country
    this.startLat = countryCoord[0];
    this.startLng = countryCoord[1];

    // Caculate line start position
    // A logica avrebbe senso farli oggietti gloali della classe
    const liveCountryCoordLat = liveCountryCoord[0];
    const liveCountryCoordLng = liveCountryCoord[1];

    // 3D Vector with position of firstCountry
    const startCountryVector: Vector3 = coordsToVector3D(
      this.startLat,
      this.startLng,
      arcRadius
    );

    // 3D Vector with position of secondCountry
    // NB: Viene leggermente incremeneto arcRadius di 2 millesimi * 1.002
    const startCountryLiveVector: Vector3 = coordsToVector3D(
      liveCountryCoordLat,
      liveCountryCoordLng,
      1.002 * arcRadius
    );

    // Clamp = morsetto, Magari indica quando deve schiacciarsi la linea
    // Max(Min(0.5 * startCountryVector.distanceTo(startCountryLiveVector), 500), 160)
    // Non ho capito perchè la distanza tra due vettori (distanceTo) viene ridotta per 0.5
    const Clamp = Numbers.clamp(
      0.5 * startCountryVector.distanceTo(startCountryLiveVector),
      160,
      500
    );

    // Normalize coord value
    // This return another function
    const x = P(
      [this.startLng, this.startLat],
      [liveCountryCoordLng, liveCountryCoordLat]
    ).fn;

    const C = x(0.25),
      R = x(0.75);
    const S = coordsToVector3D(C[1], C[0], arcRadius + Clamp),
      D = coordsToVector3D(R[1], R[0], arcRadius + Clamp),
      I = new CubicBezierCurve3(
        startCountryVector,
        S,
        D,
        startCountryLiveVector
      );
    this.geometry = new TubeGeometry(I, 44, 0.2 + arcRadius / 1200, 8, !1);
    this.material = new ShaderMaterial({
      uniforms: {
        u_time: { type: 'f', value: 0 } as IUniform<number>,
        u_texture: { type: 't', value: null } as IUniform<null>,
        speedEpsilon: { type: 'f', value: 4e-4 } as IUniform<number>, // 4*10 - 4 = 36?
      },
      vertexShader:
        '\n        varying vec2 vUv;\n\n        void main() {\n          vUv = uv;\n          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);\n        }\n      ',
      fragmentShader:
        '\n        uniform float u_time;\n        uniform sampler2D u_texture;\n        varying vec2 vUv;\n        uniform float speedEpsilon;\n\n        void main() {\n          float ramp = vUv.x * 0.5;\n          float pct = fract(ramp - u_time * speedEpsilon);\n          vec4 color = vec4(0.0, 0.0, 0.0, 1.0);\n          color = texture2D(u_texture, vec2(pct, 0.6));\n          gl_FragColor = vec4(color);\n        }\n      ',
    });
    this.active = false;
    this.mesh = new Mesh(this.geometry, this.material);
    this.add(this.mesh),
      (this.material.uniforms.u_texture.value = this.texture),
      (this.circleMaterial1 = new MeshBasicMaterial({
        map:  circleTexture, //new Texture(circleTexture),
        color: color[0],
        transparent: !0,
        opacity: 1,
        side: 2 as any,
      })),
      (this.circleMaterial2 = new MeshBasicMaterial({
        map: circleTexture, //new Texture(circleTexture),
        color: color[1],
        transparent: !0,
        opacity: 1,
        side: 2 as any,
      })),
      (this.circleGeometry = new PlaneGeometry(
        0.1 * arcRadius,
        0.1 * arcRadius,
        2
      )),
      (this.circle1 = new Mesh(this.circleGeometry, this.circleMaterial1)),
      (this.circle2 = new Mesh(this.circleGeometry, this.circleMaterial2)),
      this.circle1.scale.set(0.01, 0.01, 0.01),
      this.circle2.scale.set(0.01, 0.01, 0.01),
      this.circle1.position.set(
        startCountryVector.x,
        startCountryVector.y,
        startCountryVector.z
      ),
      this.circle2.position.set(
        startCountryLiveVector.x,
        startCountryLiveVector.y,
        startCountryLiveVector.z
      ),
      this.circle1.rotation.set(Math.PI, Math.PI, Math.PI),
      this.circle2.rotation.set(Math.PI, Math.PI, Math.PI),
      this.circle1.lookAt(new Vector3(0, 0, 0)),
      this.circle2.lookAt(new Vector3(0, 0, 0)),
      this.add(this.circle1),
      this.add(this.circle2);

    this.showLine();
  }

  public showLine() {
    (this.active = true),
      this.geometry.setDrawRange(0, 1),
      this.isStatic
        ? this.drawStaticLine()
        : ((this.startTime = performance.now()), this.drawAnimatedLine());
  }

  /**
   * If line is not active (end start animation) invoke eraseLine()
   */
  public hideLine(): void {
    if (!this.active) {
      this.eraseLine();
    }
  }

  public disposeLine() {
    this.mesh.geometry.dispose();
    this.texture.dispose();
    this.mesh.material.dispose();
    this.circle1.geometry.dispose();
    this.circle1.material.dispose();
    this.circle2.geometry.dispose();
    this.circle2.material.dispose();
    this.children = [];
  }

  public pause() {
    cancelAnimationFrame(this.animationFrame);
  }

  public play() {
    this.isStatic
      ? this.drawStaticLine()
      : this.active
      ? (this.animationFrame = requestAnimationFrame(this.drawAnimatedLine))
      : (this.animationFrame = requestAnimationFrame(this.eraseLine));
  }
}

export default DrawLinesClass;
