import { createObserver } from "./createObserver.ts";

// SSR 환경을 위한 더미 스토리지
const dummyStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

// SSR 환경에서는 localStorage가 없으므로 더미 스토리지 사용
const getDefaultStorage = () => (typeof window !== "undefined" ? window.localStorage : dummyStorage);

export const createStorage = <T>(key: string, storage = getDefaultStorage()) => {
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
