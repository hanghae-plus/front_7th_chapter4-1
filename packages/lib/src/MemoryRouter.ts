import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

/**
 * 서버 사이드 전용 MemoryRouter
 * window 객체 없이 동작합니다
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MemoryRouter<Handler extends (...args: any[]) => any> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });
  #currentPath: string;
  #currentQuery: StringRecord;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#currentPath = "/";
    this.#currentQuery = {};
  }

  get query(): StringRecord {
    return { ...this.#currentQuery };
  }

  set query(newQuery: QueryPayload) {
    this.#currentQuery = this.#sanitizeQuery(newQuery);
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

  readonly subscribe = this.#observer.subscribe;

  addRoute(path: string, handler: Handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];

    // "*" 와일드카드를 특별 처리
    if (path === "*" || path === ".*") {
      const regex = new RegExp(".*");
      this.#routes.set(path, {
        regex,
        paramNames,
        handler,
      });
      return;
    }

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

  #findRoute(url: string) {
    for (const [routePath, route] of this.#routes) {
      const match = url.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params: StringRecord = {};
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

  push(url: string) {
    const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);
    this.#currentPath = fullUrl;
    this.#route = this.#findRoute(fullUrl);
    this.#observer.notify();
  }

  start() {
    this.#route = this.#findRoute(this.#currentPath);
    this.#observer.notify();
  }

  /**
   * 서버에서 경로를 설정하는 메서드
   */
  setServerPath(pathname: string, query: StringRecord = {}) {
    this.#currentPath = pathname;
    this.#currentQuery = query;
    this.#route = this.#findRoute(pathname);
    this.#observer.notify();
  }

  #sanitizeQuery(query: QueryPayload): StringRecord {
    const result: StringRecord = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        result[key] = String(value);
      }
    }
    return result;
  }

  static parseQuery = (search: string) => {
    const params = new URLSearchParams(search);
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static stringifyQuery = (query: QueryPayload) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery: QueryPayload, baseUrl = "", currentPath = "/") => {
    const queryString = MemoryRouter.stringifyQuery(newQuery);
    return `${baseUrl}${currentPath.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
