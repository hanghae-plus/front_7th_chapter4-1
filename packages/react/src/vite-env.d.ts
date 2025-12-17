/// <reference types="vite/client" />

import type { initialProductState } from "./entities/products/productStore";

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      productStore?: typeof initialProductState;
    };
  }
}
