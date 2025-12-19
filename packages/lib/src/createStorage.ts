import { createObserver } from "./createObserver.ts";

const isServer = () => typeof window === "undefined";

/**
 * 서버 사이드에서 사용할 메모리 기반 스토리지
 * window.localStorage 대신 사용하여 브라우저 의존성 제거
 */
class InMemoryStorage implements Storage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] || null;
  }
}

/**
 * 로컬스토리지 추상화 함수
 * 서버에서는 InMemoryStorage를 사용하여 브라우저 의존성 제거
 * @param key - 스토리지 키
 * @param storage - 기본값은 클라이언트는 localStorage, 서버는 InMemoryStorage
 * @returns {Object} { get, set, reset, subscribe }
 */
export const createStorage = <T>(key: string, storage?: Storage) => {
  const actualStorage: Storage = storage ?? (isServer() ? new InMemoryStorage() : window.localStorage);
  const { subscribe, notify } = createObserver();

  const get = (): T | null => {
    try {
      const item = actualStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value: T) => {
    try {
      actualStorage.setItem(key, JSON.stringify(value));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      actualStorage.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
