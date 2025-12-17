/**
 * ClientRouter - 브라우저 환경 전용 라우터
 * BaseRouter를 상속받아 브라우저 특화 기능 추가
 */
import { BaseRouter } from "./BaseRouter.js";
import { createObserver } from "./createObserver.js";

export class ClientRouter extends BaseRouter {
  #observer;

  constructor(baseUrl = "") {
    super(baseUrl);
    this.#observer = createObserver();

    // 브라우저 전용: popstate 이벤트 리스너
    window.addEventListener("popstate", () => {
      this._setRoute(this.findRoute(window.location.pathname));
      this.#observer.notify();
    });

    // 브라우저 전용: data-link 속성 클릭 이벤트 위임
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target?.closest("[data-link]")) {
        return;
      }
      e.preventDefault();
      const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
      if (url) {
        this.push(url);
      }
    });
  }

  /**
   * 현재 쿼리 파라미터 가져오기 (브라우저 전용)
   */
  get query() {
    return ClientRouter.parseQuery(window.location.search);
  }

  /**
   * 쿼리 파라미터 업데이트 및 네비게이션 (브라우저 전용)
   */
  set query(newQuery) {
    const newUrl = this.#getUrl(newQuery);
    this.push(newUrl);
  }

  /**
   * 라우터 이벤트 구독
   * @param {Function} fn - 구독 콜백 함수
   */
  subscribe(fn) {
    return this.#observer.subscribe(fn);
  }

  /**
   * 네비게이션 실행 (브라우저 전용)
   * @param {string} url - 이동할 경로
   */
  push(url) {
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this._setRoute(this.findRoute(fullUrl));
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작 (브라우저 전용)
   */
  start() {
    this._setRoute(this.findRoute(window.location.pathname));
    this.#observer.notify();
  }

  /**
   * 쿼리 업데이트용 URL 생성
   * @private
   */
  #getUrl(newQuery) {
    const currentQuery = ClientRouter.parseQuery(window.location.search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ClientRouter.stringifyQuery(updatedQuery);
    return `${this.baseUrl}${window.location.pathname.replace(this.baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }

  /**
   * 정적 메서드: 쿼리 포함 URL 생성
   * @param {Object} newQuery - 새로운 쿼리 객체
   * @param {string} baseUrl - 베이스 URL
   * @returns {string} 생성된 URL
   */
  static getUrl(newQuery, baseUrl = "") {
    const currentQuery = ClientRouter.parseQuery(window.location.search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ClientRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }
}

// 하위 호환성을 위한 별칭 export
export { ClientRouter as Router };
