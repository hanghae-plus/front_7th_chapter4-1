/**
 * 서버 사이드용 라우터
 */
import { createObserver } from "./createObserver.js";
import { Router } from "./Router.js";

export class ServerRouter {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;
  #query;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#query = {};
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return this.#query;
  }

  set query(newQuery) {
    this.#query = { ...this.#query, ...newQuery };
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
   */
  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
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

  #findRoute(url) {
    const pathname = url.split("?")[0];
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
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
   * 서버에서 URL로 라우팅 초기화
   */
  navigate(url, query = {}) {
    this.#query = query;
    this.#route = this.#findRoute(url);
  }

  push() {
    // 서버에서는 no-op
  }

  start() {
    // 서버에서는 no-op
  }

  static parseQuery = Router.parseQuery;
  static stringifyQuery = Router.stringifyQuery;
  static getUrl = Router.getUrl;
}
