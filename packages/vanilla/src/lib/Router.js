/**
 * 간단한 SPA 라우터
 */
import { createObserver } from "./createObserver.js";

export class Router {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;
  #serverQuery = {}; // 서버 환경에서 사용할 query
  #serverParams = {}; // 서버 환경에서 사용할 params

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    // SSR 환경에서는 window가 없으므로 이벤트 리스너를 등록하지 않음
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });
    }
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    // SSR 환경에서는 #serverQuery 반환
    if (typeof window === "undefined") {
      return this.#serverQuery;
    }
    return Router.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = Router.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  get params() {
    // SSR 환경에서는 #serverParams 반환
    if (typeof window === "undefined") {
      return this.#serverParams;
    }
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url = typeof window !== "undefined" ? window.location.pathname : "/") {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const { pathname } = new URL(url, origin);
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  /**
   * 네비게이션 실행
   * @param {string} url - 이동할 경로
   */
  push(url) {
    try {
      // SSR 환경에서는 push 메서드를 실행하지 않음
      if (typeof window === "undefined") {
        return;
      }

      // baseUrl이 없으면 자동으로 붙여줌
      let fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   */
  start() {
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  /**
   * 서버 환경에서 라우트 설정
   * @param {string} url - 요청 URL
   * @param {Object} query - 쿼리 파라미터 객체
   * @param {Object} params - 라우트 파라미터 객체
   */
  setServerRoute(url, query = {}, params = {}) {
    // 서버 환경에서만 사용
    if (typeof window === "undefined") {
      this.#serverQuery = query;
      this.#serverParams = params;

      // 라우트 찾기
      const pathname = url.split("?")[0];
      const cleanPath = pathname.replace(this.#baseUrl, "").replace(/\/$/, "") || "/";

      for (const [routePath, route] of this.#routes) {
        const regexPath = routePath.replace(/:\w+/g, "([^/]+)").replace(/\//g, "\\/");
        const regex = new RegExp(`^${regexPath}$`);
        const match = cleanPath.match(regex);

        if (match) {
          this.#route = {
            ...route,
            params: { ...params },
            path: routePath,
          };
          return;
        }
      }

      // 매칭되는 라우트가 없으면 null
      this.#route = null;
    }
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search = typeof window !== "undefined" ? window.location.search : "") => {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery = (query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery, baseUrl = "") => {
    // SSR 환경에서는 window가 없으므로 빈 문자열 반환
    if (typeof window === "undefined") {
      return "";
    }

    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
