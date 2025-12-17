/**
 * 간단한 SPA 라우터
 */
import { createObserver } from "../createObserver.js";
import { BaseRouter } from "./BaseRouter.js";

export class ClientRouter extends BaseRouter {
  #observer = createObserver();

  constructor(baseUrl = "") {
    super(baseUrl);
    window.addEventListener("popstate", () => {
      this.route = this._findRoute();
      this.#observer.notify();
    });
  }

  /**
   * pathname을 가져오는 메서드 (override)
   * @protected
   */
  _getPathname(url = window.location.pathname) {
    const { pathname } = new URL(url, window.location.origin);
    return pathname;
  }

  get query() {
    return ClientRouter.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = ClientRouter.getUrl(newQuery, this.baseUrl);
    this.push(newUrl);
  }

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 네비게이션 실행
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

      this.route = this._findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   */
  start() {
    this.route = this._findRoute();
    this.#observer.notify();
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search = window.location.search) => {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static getUrl = (newQuery, baseUrl = "") => {
    const currentQuery = ClientRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ClientRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
