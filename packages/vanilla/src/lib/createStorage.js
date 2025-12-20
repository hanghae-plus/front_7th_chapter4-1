/**
 * 더미 스토리지 (SSR 환경용)
 */
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage (브라우저 환경) 또는 더미 스토리지 (SSR 환경)
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = null) => {
  // SSR 환경 체크: storage가 명시되지 않으면 환경에 따라 자동 선택
  const storageInstance = storage || (typeof window !== "undefined" ? window.localStorage : dummyStorage);

  const get = () => {
    try {
      const item = storageInstance.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      storageInstance.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      storageInstance.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
