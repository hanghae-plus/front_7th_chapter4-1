import { createObserver } from "./createObserver.ts";

export const createStorage = <T>(key: string, storage?: Storage) => {
  // Use lazy initialization - only access window.localStorage when needed
  const getStorage = () => storage ?? (typeof window !== "undefined" ? window.localStorage : null);

  let data: T | null = null;
  const storageInstance = getStorage();
  if (storageInstance) {
    data = JSON.parse(storageInstance.getItem(key) ?? "null");
  }

  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      const storageInstance = getStorage();
      if (storageInstance) {
        storageInstance.setItem(key, JSON.stringify(data));
      }
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      const storageInstance = getStorage();
      if (storageInstance) {
        storageInstance.removeItem(key);
      }
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
