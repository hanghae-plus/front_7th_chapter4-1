/**
 * 서버 사이드에서 사용할 메모리 기반 스토리지
 * window.localStorage 대신 사용하여 브라우저 의존성 제거
 */
export class InMemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  setItem(key, value) {
    this.data.set(key, value);
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}
