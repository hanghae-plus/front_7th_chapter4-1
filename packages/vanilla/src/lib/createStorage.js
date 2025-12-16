import { isServer } from "../utils/envUtils.js";

/**
 * 서버용 메모리 스토리지 (localStorage 대체)
 */
const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
};

/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage (서버에서는 메모리 스토리지)
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = null) => {
  // 서버 환경이거나 storage가 제공되지 않은 경우 적절한 스토리지 선택
  const actualStorage = storage || (isServer() ? createMemoryStorage() : window.localStorage);

  const get = () => {
    try {
      const item = actualStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      actualStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      actualStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
