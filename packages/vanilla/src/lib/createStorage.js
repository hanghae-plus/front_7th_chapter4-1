/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */
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

export const createStorage = (key, storage = null) => {
  // 클라이언트 환경에서는 localStorage 사용, 서버 환경에서는 더미 스토리지 사용
  const safeStorage = storage || getStorage();

  const get = () => {
    try {
      const item = safeStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      safeStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
