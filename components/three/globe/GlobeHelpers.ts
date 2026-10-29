// Declare mathematical constant
export const Pi = Math.PI;
export const PiMezzi = Pi / 2;
export const ConvToDegree = 180 / Pi; // Gradi per radiante (~57.2958°). Uso: deg = rad * ConvToDegree
export const ConvToRadia = Pi / 180;  // Radianti per grado (~0.01745 rad). Uso: rad = deg * ConvToRadia

/**
 * Some Numbers helper functions
 */
export const Numbers = {
  clamp: function (n: number, t: number, r: number) {
    return Math.max(Math.min(n, r), t);
  },
  lerp: function (n: number, t: number, r: number) {
    return n * (1 - r) + t * r;
  },
  random: function (n: number, t: number) {
    return Math.random() * (t - n) + n;
  },
};

/**
 * Some Animation Easing helper functions
 */
export const Easing = {
  ease: function (t: number) {
    return t < 0.5 ? 2 * t * t : (4 - 2 * t) * t - 1;
  },
  easeInOutCubic: function (t: number, n: number, e: number, u: number) {
    return (t /= u / 2) < 1
      ? (e / 2) * t * t * t + n
      : (e / 2) * ((t -= 2) * t * t + 2) + n;
  },
  easeInQuart: function (t: number, n: number, e: number, u: number) {
    const r = t / u;
    return e * r * r ** 3 + n;
  },
  easeOutQuart: function (t: number, n: number, e: number, u: number) {
    const r = t / u - 1;
    return -e * (r * r ** 3 - 1) + n;
  },
  easeInOutQuart: function (t: number, n: number, e: number, u: number) {
    let r = t / (u / 2);
    return r < 1
      ? (e / 2) * r ** 4 + n
      : ((r -= 2), (-e / 2) * (r * r ** 3 - 2) + n);
  },
  easeInOutBack: function (
    t: number,
    n: number,
    e: number,
    u: number,
    r: number
  ) {
    let a = null == r ? 1.70158 : r,
      s = t / (u / 2);
    return (
      (a = 1.525 * a + 1),
      s < 1
        ? (e / 2) * (s * s * (a * s - a) + n)
        : ((s -= 2), (e / 2) * (s * s * (a * s + a) + 2) + n)
    );
  },
  easeOutElastic: function (
    t: number,
    n: number,
    e: number,
    u: number,
    r: number = 700
  ) {
    if (!t || !e) return n;
    const a = t / u;
    if (1 === a) return n + e;
    const s = e,
      c = u * (1 - Math.min(r, 999) / 1e3),
      i = s < Math.abs(e) ? c / 4 : (c / (2 * Math.PI)) * Math.asin(e / s);
    return (
      s * 2 ** (-10 * a) * Math.sin(((a * u - i) * (2 * Math.PI)) / c) + e + n
    );
  },
};

/**
 * Some Timing helper functions
 */
export const Timing = {
  humanizeDuration: (e: number, n: boolean = false) =>
    n ? e : Math.round((Math.random() * e) / 2) + e,
  sleep: (e: number) =>
    new Promise((n: any): void => {
      const r = performance.now();
      requestAnimationFrame(function t(o: number) {
        o - r >= e ? n() : requestAnimationFrame(t);
      });
    }),
  delay: (e: () => void, n: number) => {
    let r = false;
    const t = performance.now();
    return (
      requestAnimationFrame(function o(a: number) {
        a - t >= n && !r ? e() : r || requestAnimationFrame(o);
      }),
      () => {
        r = true;
      }
    );
  },
  onInterval: (e: () => void, n: number) => {
    let r = false,
      t = performance.now();
    return (
      requestAnimationFrame(function o(a: number) {
        a - t >= n && ((t = a), e()), r || requestAnimationFrame(o);
      }),
      () => {
        r = true;
      }
    );
  },
};

/**
 * List of all country with Coords
 * @TODO: Capire se sono già in proporzione per il mondo
 *
 * From google - country centroids: https://developers.google.com/public-data/docs/canonical/countries_csv
 *      google  IT: [41.87194, 12.56738]
 * Our centroid IT: [42.8333, 12.8333],
 *
 *      google  GB(UK): [55.378051	-3.435973]
 * Our centroid GB(UK): [54, -2],
 *
 * Le nostre coordinate sono state leggermente arrotondate; essendo una rappresentazione di tutto il globo mi interessa che sia detro lo stato.
 *
 * Spiegazione del sistema di coordinate globale
 * https://coordinates-converter.com/it/info
 *
 * La precisione di questa specifica dipende fortemente dal numero di cifre decimali.
 * Con solo 2 cifre decimali c'è una possibile deviazione fino a 1 km, con 4 cifre dopo il punto decimale c'è solo una deviazione di 10 m,
 * Come la maggior parte dei sistemi, usiamo 6 cifre decimali, che corrispondono ad una precisione di 1 metro.
 */
export const CountryCoords: { [countryCode: string]: [number, number] } = {
  ad: [42.5, 1.5],
  ae: [24, 54],
  af: [33, 65],
  al: [41, 20],
  am: [40, 45],
  an: [12.25, -68.75],
  ao: [-12.5, 18.5],
  ap: [35, 105],
  aq: [-90, 0],
  ar: [-34, -64],
  at: [47.3333, 13.3333],
  au: [-27, 133],
  aw: [12.5, -69.9667],
  az: [40.5, 47.5],
  ba: [44, 18],
  bd: [24, 90],
  be: [50.8333, 4],
  bf: [13, -2],
  bg: [43, 25],
  bh: [26, 50.55],
  bi: [-3.5, 30],
  bj: [9.5, 2.25],
  bn: [4.5, 114.6667],
  bo: [-17, -65],
  br: [-10, -55],
  bt: [27.5, 90.5],
  bv: [-54.4333, 3.4],
  bw: [-22, 24],
  bz: [17.25, -88.75],
  ca: [54, -100],
  cd: [0, 25],
  cf: [7, 21],
  ch: [47, 8],
  cl: [-30, -71],
  cm: [6, 12],
  cn: [35, 105],
  co: [4, -72],
  cr: [10, -84],
  cy: [35, 33],
  cz: [49.75, 15.5],
  de: [51, 9],
  dj: [11.5, 43],
  dk: [56, 10],
  do: [19, -70.6667],
  dz: [28, 3],
  ec: [-2, -77.5],
  ee: [59, 26],
  eg: [27, 30],
  eh: [24.5, -13],
  er: [15, 39],
  es: [40, -4],
  et: [8, 38],
  eu: [47, 8],
  fi: [64, 26],
  fo: [62, -7],
  fr: [46, 2],
  ga: [-1, 11.75],
  gb: [54, -2],
  ge: [42, 43.5],
  gf: [4, -53],
  gh: [8, -2],
  gi: [36.1833, -5.3667],
  gl: [72, -40],
  gm: [13.4667, -16.5667],
  gn: [11, -10],
  gq: [2, 10],
  gr: [39, 22],
  gt: [15.5, -90.25],
  gw: [12, -15],
  gy: [5, -59],
  hk: [22.25, 114.1667],
  hn: [15, -86.5],
  hr: [45.1667, 15.5],
  ht: [19, -72.4167],
  hu: [47, 20],
  id: [-5, 120],
  ie: [53, -8],
  il: [31.5, 34.75],
  in: [20, 77],
  is: [65, -18],
  it: [42.8333, 12.8333],
  jm: [18.25, -77.5],
  jo: [31, 36],
  jp: [36, 138],
  ke: [1, 38],
  kg: [41, 75],
  kh: [13, 105],
  kr: [37, 127.5],
  kw: [29.3375, 47.6581],
  kz: [48, 68],
  la: [18, 105],
  lb: [33.8333, 35.8333],
  li: [47.1667, 9.5333],
  lk: [7, 81],
  ls: [-29.5, 28.5],
  lt: [56, 24],
  lu: [49.75, 6.1667],
  lv: [57, 25],
  ly: [25, 17],
  ma: [32, -5],
  mc: [43.7333, 7.4],
  md: [47, 29],
  me: [42, 19],
  mg: [-20, 47],
  mk: [41.8333, 22],
  ml: [17, -4],
  mn: [46, 105],
  mo: [22.1667, 113.55],
  mr: [20, -12],
  mw: [-13.5, 34],
  mx: [23, -102],
  my: [2.5, 112.5],
  mz: [-18.25, 35],
  na: [-22, 17],
  ne: [16, 8],
  ng: [10, 8],
  ni: [13, -85],
  nl: [52.5, 5.75],
  no: [62, 10],
  np: [28, 84],
  nz: [-41, 174],
  om: [21, 57],
  pa: [9, -80],
  pe: [-10, -76],
  pg: [-6, 147],
  ph: [13, 122],
  pk: [30, 70],
  pl: [52, 20],
  pm: [46.8333, -56.3333],
  ps: [32, 35.25],
  pt: [39.5, -8],
  py: [-23, -58],
  qa: [25.5, 51.25],
  ro: [46, 25],
  rs: [44, 21],
  ru: [60, 100],
  rw: [-2, 30],
  sa: [25, 45],
  se: [62, 15],
  sg: [1.3667, 103.8],
  si: [46, 15],
  sj: [78, 20],
  sk: [48.6667, 19.5],
  sl: [8.5, -11.5],
  sm: [43.7667, 12.4167],
  sn: [14, -14],
  so: [10, 49],
  sr: [4, -56],
  sv: [13.8333, -88.9167],
  sz: [-26.5, 31.5],
  td: [15, 19],
  tg: [8, 1.1667],
  th: [15, 100],
  tj: [39, 71],
  tn: [34, 9],
  tr: [39, 35],
  tt: [11, -61],
  tw: [23.5, 121],
  tz: [-6, 35],
  ua: [49, 32],
  ug: [1, 32],
  us: [38, -97],
  uy: [-33, -56],
  uz: [41, 64],
  va: [41.9, 12.45],
  ve: [8, -66],
  vn: [16, 106],
  ye: [15, 48],
  za: [-29, 24],
  zm: [-15, 30],
};

/** countryCoord: [lng, lat], countryLiveCoord: [lng, lat]
 * NB: Vengono usate funioni Seno e Coseno perchè il sistema di coordinate reale
 *     è basato su una sfera:
 * NB: https://it.wikipedia.org/wiki/Sistema_di_coordinate
 *     Vedere sezione sulla coordinate di una sfera
 *
 * Vengono espresse in GRADI in quanto sono DEGLI ANGOLI
 * https://it.quora.com/Perch%C3%A9-la-longitudine-e-la-latitudine-vengono-espresse-in-gradi
 * La LAT va da -90 a +90
 * la LNG va -180 a + 180
 */

// NB: questa si può chiamare tipo coordsToVector2()
export function P(
  countryCoord: [number, number],
  countryLiveCoord: [number, number]
): {
  distance: number;
  fn: (t: number) => number[];
} {
  // Multiply coord with Deg (Pi/180)
  // Converto in radianti
  const firstLngRadiant = countryCoord[0] * ConvToRadia;
  const firstLatRadiant = countryCoord[1] * ConvToRadia;
  const secondLngRadiant = countryLiveCoord[0] * ConvToRadia;
  const secondLatDeg = countryLiveCoord[1] * ConvToRadia;

  // Calculate SENO e COSENO della LATITUDINE (sia primo che secondo)
  // Seno e coseno servono in trigonometria per calcolare i trianoli nelle circoferene
  const firstLatCos = Math.cos(firstLatRadiant);
  const firstLatSin = Math.sin(firstLatRadiant);
  const secondLatCos = Math.cos(secondLatDeg);
  const secondLatSin = Math.sin(secondLatDeg);

  // Multiply latCos * lngCos
  // Calcolo le coordinate
  const multiplyFirstCos = firstLatCos * Math.cos(firstLngRadiant);
  const multiplyFirstSin = firstLatCos * Math.sin(firstLngRadiant);
  const multiplySeondCos = secondLatCos * Math.cos(secondLngRadiant);
  const multiplySecondSin = secondLatCos * Math.sin(secondLngRadiant);

  const p = Math.sqrt(
    E(secondLatDeg - firstLatRadiant) +
      firstLatCos * secondLatCos * E(secondLngRadiant - firstLngRadiant)
  );

  // Three case: p > 1,
  const distance = 2 * (p > 1 ? PiMezzi : p < -1 ? -PiMezzi : Math.asin(p));
  const sinDistance = Math.sin(distance);

  // Initialize ReturnObject
  const retFn: {
    distance: number;
    fn: (t: number) => [number, number];
  } = {
    distance: 0,
    fn: () => [0, 0],
  };

  if (distance) {
    retFn.fn = function (t: number) {
      const i = Math.sin((t *= distance)) / sinDistance,
        e = Math.sin(distance - t) / sinDistance,
        s = e * multiplyFirstCos + i * multiplySeondCos,
        a = e * multiplyFirstSin + i * multiplySecondSin,
        n = e * firstLatSin + i * secondLatSin;

      // Ritorna i Gradi
      return [
        Math.atan2(a, s) * ConvToDegree,
        Math.atan2(n, Math.sqrt(s * s + a * a)) * ConvToDegree,
      ];
    };
  } else {
    retFn.fn = function () {
      // Ritorna i Gradi
      return [firstLngRadiant * ConvToDegree, firstLatRadiant * ConvToDegree];
    };
  }

  retFn.distance = distance;

  return retFn;
}

// lngDiff = secondLngDeg - firstLngDeg
// Il seno della metà della differenza delle due longitudini e moltiplica per la differenza
function E(lngDiff: number) {
  return Math.sin(lngDiff / 2) * lngDiff;
}
