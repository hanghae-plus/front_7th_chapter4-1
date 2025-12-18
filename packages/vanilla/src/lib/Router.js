/**
 * 간단한 SPA 라우터
 */
import { createObserver } from "./createObserver.js";

const isServer = typeof window === "undefined";

export class Router {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;
  #currentUrl = "/"; // SSR용: 현재 URL 저장
  #currentSearch = "";

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    if (!isServer) {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });
    }
  }

  // SSR에서 URL 설정용 메서드
  setServerUrl(url, search = "") {
    this.#currentUrl = url;
    this.#currentSearch = search;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    const search = isServer ? this.#currentSearch : window.location.search;
    return Router.parseQuery(search);
  }

  set query(newQuery) {
    const newUrl = Router.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  get params() {
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

  #findRoute(url = "") {
    const pathname = url || (isServer ? this.#currentUrl : window.location.pathname);
    const origin = isServer ? "http://localhost" : window.location.origin;
    const { pathname: normalizedPath } = new URL(pathname, origin);

    for (const [routePath, route] of this.#routes) {
      const match = normalizedPath.match(route.regex);
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
    if (isServer) return;
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const normalizedUrl = url.startsWith(this.#baseUrl)
        ? url
        : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const { pathname: normalizedPath, search: normalizedSearch } = new URL(normalizedUrl, window.location.origin);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;
      const fullUrl = `${normalizedPath}${normalizedSearch}`;
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
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search = "") => {
    if (!search && !isServer) {
      search = window.location.search;
    }

    const origin = isServer ? "http://localhost" : window.location.origin;

    const { search: normalizedSearch } = new URL(search, origin);
    const params = new URLSearchParams(normalizedSearch);
    const query = {};
    for (const [key, value] of params) {
      query[key] = decodeURIComponent(value);
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
    if (isServer) return ""; // 또는 적절한 처리

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

  // Router.js에 추가
  matchRoute(url) {
    this.#route = this.#findRoute(url);
    return this.#route;
  }
}
