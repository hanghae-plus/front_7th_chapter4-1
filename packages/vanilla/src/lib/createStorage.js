/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage (브라우저 환경에서만)
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = typeof window !== "undefined" ? window.localStorage : null) => {
  // 서버 환경에서는 메모리 스토리지 사용
  if (!storage) {
    const memoryStorage = {};
    return {
      get: () => memoryStorage[key] || null,
      set: (value) => {
        memoryStorage[key] = value;
      },
      reset: () => {
        delete memoryStorage[key];
      },
    };
  }

  // 브라우저 환경에서는 localStorage 사용
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
