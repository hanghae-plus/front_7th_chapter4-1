/**
 * 간단한 SPA 라우터
 */
import { createObserver } from "./createObserver.js";

export class ServerRouter {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;
  #query;
  #currentUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#query = {};
    this.#currentUrl = "";
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return this.#query;
  }

  set query(newQuery) {
    this.#query = newQuery;
  }

  /**
   * SSR용: 현재 URL 설정 및 쿼리 파싱
   * @param {string} url - 요청 URL
   */
  setUrl(url) {
    this.#currentUrl = url;

    // URL에서 쿼리 파라미터 추출
    try {
      const urlObj = new URL(url, "http://localhost");
      this.#query = ServerRouter.parseQuery(urlObj.search);
    } catch {
      this.#query = {};
    }
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

  #findRoute(url = null) {
    const targetUrl = url;
    const origin = "http://localhost";
    const { pathname } = new URL(targetUrl, origin);

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
   * 라우터 시작
   */
  start() {
    this.#route = this.#findRoute(this.#currentUrl || this.#baseUrl);
    this.#observer.notify();
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search = null) => {
    const searchString = search ?? "";
    const params = new URLSearchParams(searchString);
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
    return baseUrl || "/";
  };
}
