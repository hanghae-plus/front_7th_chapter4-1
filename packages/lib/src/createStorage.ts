import { createObserver } from "./createObserver.ts";

// 서버 환경 체크를 먼저 수행
const getStorage = () => {
  if (typeof window === "undefined") {
    // 서버 환경: 더미 스토리지 반환
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  // 클라이언트 환경: localStorage 반환
  return window.localStorage;
};

export const createStorage = <T>(key: string, storage?: Storage | null) => {
  // 클라이언트 환경에서는 localStorage 사용, 서버 환경에서는 더미 스토리지 사용
  const safeStorage = storage || getStorage();

  let data: T | null = null;
  try {
    const item = safeStorage.getItem(key);
    data = item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error parsing storage item for key "${key}":`, error);
    data = null;
  }

  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      safeStorage.setItem(key, JSON.stringify(data));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      safeStorage.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
