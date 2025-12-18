/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage) => {
  // 서버 환경에서는 storage를 사용할 수 없음
  const actualStorage = storage || (typeof window !== "undefined" ? window.localStorage : null);

  const get = () => {
    if (!actualStorage) return null;
    try {
      const item = actualStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    if (!actualStorage) return;
    try {
      actualStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    if (!actualStorage) return;
    try {
      actualStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
