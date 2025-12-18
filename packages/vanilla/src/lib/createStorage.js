/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage) => {
  // 서버 환경 처리: window가 없으면 가짜 storage 사용
  const actualStorage = storage || (typeof window !== "undefined" ? window.localStorage : createMockStorage());

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

// 서버 환경용 가짜 storage (메모리에만 저장)
function createMockStorage() {
  const data = {};
  return {
    getItem: (key) => data[key] || null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}
