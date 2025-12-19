import type { PageData } from "../contexts/InitialDataContext";

declare global {
  interface Window {
    __INITIAL_DATA__?: PageData;
  }
}

export {};
