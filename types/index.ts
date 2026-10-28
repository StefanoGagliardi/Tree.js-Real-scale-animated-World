import type { RefObject, RefCallback } from "react";

export type IRefObject<T extends HTMLElement = HTMLElement> = RefObject<T | null>;
export type IRefCallback<T extends HTMLElement = HTMLElement> = RefCallback<T | null>;

/**
 * Define ref type
 */
export type IRef<T extends HTMLElement = HTMLElement> =
  | IRefObject<T>
  | IRefCallback<T>;
