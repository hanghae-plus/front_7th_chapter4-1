import { createObserver } from "./createObserver.ts";

// SSR 환경에서 localStorage가 없을 때 사용할 메모리 스토리지
// 서버 사이드에서는 window 객체가 없으니까 이걸 사용함
const memoryStorage = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k) : null),
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
  };
})();

/**
 * localStorage를 추상화한 스토리지 생성 함수
 * SSR 환경에서는 메모리 스토리지를 사용하고, 클라이언트에서는 localStorage를 사용함
 */
export const createStorage = <T>(key: string, storage?: Storage) => {
  // storage가 명시적으로 주어지면 그것을 사용하고, 아니면 환경에 따라 선택
  // window가 있으면 localStorage 사용, 없으면 메모리 스토리지 사용 (SSR 환경)
  const storageImpl =
    storage ?? (typeof window !== "undefined" && window?.localStorage ? window.localStorage : memoryStorage);

  // 초기 데이터를 스토리지에서 불러옴
  let data: T | null = JSON.parse(storageImpl.getItem(key) ?? "null");
  const { subscribe, notify } = createObserver();

  const get = () => data;

  /**
   * 스토리지에 값을 저장
   */
  const set = (value: T) => {
    try {
      data = value;
      storageImpl.setItem(key, JSON.stringify(data));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  /**
   * 스토리지에서 값 제거
   */
  const reset = () => {
    try {
      data = null;
      storageImpl.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
