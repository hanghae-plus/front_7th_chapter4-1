import { BaseRouter } from "./BaseRouter.js";
import { createObserver } from "./createObserver.js";

/**
 * 클라이언트 라우터
 */
export class ClientRouter extends BaseRouter {
  #observer = createObserver();

  constructor(baseUrl = "") {
    super(baseUrl);

    window.addEventListener("popstate", () => {
      this._setRoute(this.findRoute(window.location.pathname));
      this.#observer.notify();
    });
  }

  get query() {
    return BaseRouter.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = this.getUrl(newQuery, this.baseUrl);
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
      let fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);

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
   * 라우터 시작
   */
  start() {
    this._setRoute(this.findRoute(window.location.pathname));
    this.#observer.notify();
  }

  getUrl = (newQuery, baseUrl = "") => {
    const currentQuery = BaseRouter.parseQuery(window.location.search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = BaseRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
