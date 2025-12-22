/**
 * Platform adapter - auto-selects browser or server implementation
 */
export const platform = import.meta.env.SSR
  ? (await import("./server.js")).platform
  : (await import("./browser.js")).platform;
