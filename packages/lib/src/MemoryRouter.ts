import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface MemoryRoute<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export type MemoryRouterInstance<
  T extends AnyFunction & {
    loader?: (router: MemoryRouterInstance<T>) => Promise<{ data: unknown; title: string } | undefined>;
  },
> = InstanceType<typeof MemoryRouter<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MemoryRouter<Handler extends (...args: any[]) => any> {
  readonly #routes: Map<string, MemoryRoute<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;
  #query;
  #currentUrl;

  #route: null | (MemoryRoute<Handler> & { params: StringRecord; path: string });

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#query = {};
    this.#currentUrl = "";
  }

  get query(): StringRecord {
    return this.#query;
  }

  set query(newQuery: QueryPayload) {
    this.#query = newQuery;
  }

  /**
   * SSR용: 현재 URL 설정 및 쿼리 파싱
   * @param {string} url - 요청 URL
   */
  setUrl(url: string) {
    this.#currentUrl = url;

    // URL에서 쿼리 파라미터 추출
    try {
      const urlObj = new URL(url, "http://localhost");
      this.#query = MemoryRouter.parseQuery(urlObj.search);
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

  readonly subscribe = this.#observer.subscribe;

  addRoute(path: string, handler: Handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
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

  #findRoute(url: string | null = null) {
    const targetUrl = url ?? this.#currentUrl;
    const { pathname } = new URL(targetUrl || "", "http://localhost");
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
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

  start() {
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  static parseQuery = (search: string | null = null) => {
    const searchString = search ?? "";
    const params = new URLSearchParams(searchString);
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

  static getUrl = (newQuery: QueryPayload, baseUrl = "") => {
    const currentQuery = MemoryRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = MemoryRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${queryString ? `?${queryString}` : ""}` || "/";
  };
}
