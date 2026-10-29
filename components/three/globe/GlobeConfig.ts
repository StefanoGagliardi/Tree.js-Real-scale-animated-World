/**
 * Custom dots density otherwise this:
 * 
 */
export const DotsDensity: number = 20000;

// DEBUG ONLY
export const IS_STATIC: boolean = false;
export const DISABLE_FILL: boolean = false;
export const DISABLE_LINES: boolean = false;
export const CUSTOM_DOTS_DENSITY: boolean = false;
export const ENABLE_EUROPE_BORDERS: boolean = true;

// Animated Lines (Archi) Configuration
export const LINE_INTERVAL_MS: number = 600;   // Frequenza di generazione in millisecondi
export const LINE_LIFETIME_MS: number = 3000;  // Durata di permanenza della linea prima del riassorbimento in ms
export const LINES_PER_CYCLE: number = 1;      // Numero di archi generati ad ogni ciclo
export const STATIC_LINE_COUNT: number = 8;    // Numero di linee generate in modalità statica