/**
 * Server platform adapter
 * - Provides noop/stub implementations for SSR
 */
import type { Platform } from "./types";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
} as Storage;

const noopLocation = {
  href: "",
  pathname: "/",
  search: "",
  hash: "",
  origin: "",
  protocol: "https:",
  host: "",
  hostname: "",
  port: "",
} as Location;

const noopHistory = {
  pushState: () => {},
  replaceState: () => {},
  back: () => {},
  forward: () => {},
  go: () => {},
  scrollRestoration: "auto",
  length: 0,
  state: null,
} as History;

export const serverPlatform: Platform = {
  // Storage - noop
  get storage() {
    return noopStorage;
  },

  // Location - noop
  get location() {
    return noopLocation;
  },

  // History - noop
  get history() {
    return noopHistory;
  },

  // Event listeners - noop
  addEventListener() {},
  removeEventListener() {},

  // Scroll info - noop
  get scrollY() {
    return 0;
  },

  get innerHeight() {
    return 0;
  },
};
