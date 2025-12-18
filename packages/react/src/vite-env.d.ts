/// <reference types="vite/client" />

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      productStore?: typeof import("./entities/products/productStore").initialProductState;
    };
  }
}

export {};
