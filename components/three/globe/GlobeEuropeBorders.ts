import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
} from 'three';
import { coordsToVector3D } from './GlobeClass';
import { getWebSiteUrl } from '@config/site';

interface GeoJsonFeature {
  type: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any[];
  };
  properties?: any;
}

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

/**
 * Traccia i confini degli stati europei come linee vettoriali sottili (LineSegments)
 * perfettamente allineate sulla sfera sopra la texture a pallini.
 */
export class GlobeEuropeBorders extends Group {
  public lineMesh: LineSegments | null = null;
  public material: LineBasicMaterial | null = null;
  public geometry: BufferGeometry | null = null;
  public isLoaded: boolean = false;
  private targetOpacity: number = 0.65;

  constructor(
    public radius: number,
    public onLoaded?: () => void,
    public borderColor: number = 0x38bdf8 // Azzurro tech brillante in palette col design
  ) {
    super();
    this.loadBorders();
  }

  /**
   * Carica il GeoJSON dei paesi europei ed estrae i confini poligonali
   */
  public loadBorders = async (): Promise<void> => {
    try {
      const url = `${getWebSiteUrl()}/globe/europe.geojson`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('GlobeEuropeBorders: Impossibile caricare', url, res.statusText);
        return;
      }
      const data: GeoJsonData = await res.json();
      this.buildGeometry(data);
    } catch (err) {
      console.error('GlobeEuropeBorders error:', err);
    }
  };

  /**
   * Converte le coordinate geografiche [lng, lat] dei poligoni in segmenti 3D
   * accorpati in un'unica BufferGeometry per massimizzare le prestazioni WebGL.
   */
  public buildGeometry = (data: GeoJsonData): void => {
    const vertices: number[] = [];
    // Leggero offset radiale (+0.1%) sopra la sfera dei pallini per evitare z-fighting
    const lineRadius = this.radius * 1.0012;

    for (const feature of data.features) {
      const geom = feature.geometry;
      if (!geom || !geom.coordinates) continue;

      if (geom.type === 'Polygon') {
        this.processPolygon(geom.coordinates, lineRadius, vertices);
      } else if (geom.type === 'MultiPolygon') {
        for (const polygon of geom.coordinates) {
          this.processPolygon(polygon, lineRadius, vertices);
        }
      }
    }

    if (vertices.length === 0) return;

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3)
    );

    this.material = new LineBasicMaterial({
      color: this.borderColor,
      transparent: true,
      opacity: 0, // Inizia da 0 e fa fade-in progressivo insieme al reveal del globo
      depthWrite: false,
    });

    this.lineMesh = new LineSegments(this.geometry, this.material);
    this.add(this.lineMesh);
    this.isLoaded = true;

    if (this.onLoaded) {
      this.onLoaded();
    }
  };

  /**
   * Elabora gli anelli (rings) di ciascun poligono creando coppie di vertici (v1 -> v2)
   */
  private processPolygon = (
    polygon: number[][][],
    radius: number,
    vertices: number[]
  ): void => {
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 2) continue;
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = ring[i];
        const p2 = ring[i + 1];

        // Standard GeoJSON: [longitude, latitude]
        const v1 = coordsToVector3D(p1[1], p1[0], radius);
        const v2 = coordsToVector3D(p2[1], p2[0], radius);

        vertices.push(v1.x, v1.y, v1.z);
        vertices.push(v2.x, v2.y, v2.z);
      }
    }
  };

  /**
   * Aggiorna l'opacità (usata durante la revealAnimation del globo)
   */
  public setOpacity = (delta: number): void => {
    if (this.material) {
      this.material.opacity = this.targetOpacity * Math.min(1, Math.max(0, delta));
    }
  };

  /**
   * Rilascia le risorse GPU e rimuove la mesh
   */
  public dispose = (): void => {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    this.clear();
  };
}

export default GlobeEuropeBorders;
