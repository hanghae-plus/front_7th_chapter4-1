/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// 서버 환경에서는 window가 없으므로 조건부 처리
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (typeof window !== "undefined" && window.__spyCalls) {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
