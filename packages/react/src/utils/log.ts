/* eslint-disable @typescript-eslint/no-explicit-any */
import { isServer } from "./isServer";

declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

if (!isServer()) {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (!isServer()) {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
