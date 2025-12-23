/**
 * Browser platform adapter
 * - Provides access to browser-specific APIs
 */
export const platform = {
  // Storage
  get storage() {
    return window.localStorage;
  },

  // Location (read-only access)
  get location() {
    return window.location;
  },

  // History
  get history() {
    return window.history;
  },

  // Event listeners
  addEventListener(event, handler, options) {
    window.addEventListener(event, handler, options);
  },

  removeEventListener(event, handler, options) {
    window.removeEventListener(event, handler, options);
  },

  // Scroll info
  get scrollY() {
    return window.pageYOffset || document.documentElement.scrollTop;
  },

  get innerHeight() {
    return window.innerHeight;
  },
};
