/**
 * SSR 환경에서 localStorage가 없을 때 사용할 메모리 스토리지
 * 서버 사이드에서는 window 객체가 없으니까 이걸 사용함
 *
 * localStorage와 동일한 인터페이스를 제공하지만 메모리에만 저장됨
 */
const memoryStorage = (() => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
})();

/**
 * localStorage를 추상화한 스토리지 생성 함수
 * SSR 환경에서는 메모리 스토리지를 사용하고, 클라이언트에서는 localStorage를 사용함
 * @param {string} key - 스토리지에 저장할 키
 * @param {Storage} storage - 사용할 스토리지 구현체 (옵션, 없으면 환경에 따라 자동 선택)
 * @returns {Object} { get, set, reset } - 스토리지 조작 함수들
 */
export const createStorage = (key, storage) => {
  // storage가 명시적으로 주어지면 그것을 사용하고, 아니면 환경에 따라 선택
  // window가 있으면 localStorage 사용, 없으면 메모리 스토리지 사용 (SSR 환경)
  const storageImpl =
    storage ?? (typeof window !== "undefined" && window?.localStorage ? window.localStorage : memoryStorage);

  /**
   * 스토리지에서 값을 가져옴
   * JSON으로 직렬화된 값을 파싱하여 반환
   * @returns {any|null} 저장된 값 또는 null
   */
  const get = () => {
    try {
      const item = storageImpl.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  /**
   * 스토리지에 값을 저장
   * 값을 JSON으로 직렬화하여 저장
   * @param {any} value - 저장할 값
   */
  const set = (value) => {
    try {
      storageImpl.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  /**
   * 스토리지에서 값 제거
   */
  const reset = () => {
    try {
      storageImpl.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};

/**
 * 메모리 스토리지 생성 함수
 * 테스트나 임시 저장소가 필요할 때 사용
 *
 * @returns {Object} { get, set, reset } - 메모리 스토리지 조작 함수들
 */
export const createMemoryStorage = () => {
  const storage = new Map();

  return {
    get: (key) => storage.get(key),
    set: (key, value) => storage.set(key, value),
    reset: () => storage.clear(),
  };
};
