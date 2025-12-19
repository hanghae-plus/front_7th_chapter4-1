import { isServer } from "../utils/isServer.js";
import { InMemoryStorage } from "./InMemoryStorage.js";

/**
 * 로컬스토리지 추상화 함수
 * 서버에서는 InMemoryStorage를 사용하여 브라우저 의존성 제거
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 클라이언트는 localStorage, 서버는 InMemoryStorage
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = isServer() ? new InMemoryStorage() : window.localStorage) => {
  const get = () => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
