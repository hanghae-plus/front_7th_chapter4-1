import { createObserver } from "./createObserver.ts";

// 더미 스토리지 (서버 환경용)
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const createStorage = <T>(
  key: string,
  storage = typeof window !== "undefined" ? window.localStorage : dummyStorage,
) => {
  let data: T | null = JSON.parse(storage.getItem(key) ?? "null");
  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      storage.setItem(key, JSON.stringify(data));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      storage.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
