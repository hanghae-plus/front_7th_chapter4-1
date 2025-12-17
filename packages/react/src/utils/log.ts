/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// Only initialize in browser environment
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  // Only track calls in browser
  if (typeof window !== "undefined") {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
