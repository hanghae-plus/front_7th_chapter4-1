/**
 * Server platform adapter
 * - Provides noop/stub implementations for SSR
 */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

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
};

const noopHistory = {
  pushState: () => {},
  replaceState: () => {},
  back: () => {},
  forward: () => {},
  go: () => {},
  length: 0,
  state: null,
};

export const platform = {
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
