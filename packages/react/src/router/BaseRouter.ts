import type { StringRecord } from "../types";

export interface Route<Handler> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
}

export interface RouteMatch<Handler> extends Route<Handler> {
  params: StringRecord;
  path: string;
}

export type QueryPayload = Record<string, string | number | undefined>;

/**
 * 기본 라우터 클래스
 * ClientRouter와 ServerRouter의 공통 기능을 제공
 */
export abstract class BaseRouter<Handler extends (...args: never[]) => unknown> {
  protected routes: Map<string, Route<Handler>>;
  protected currentRoute: RouteMatch<Handler> | null;
  protected _baseUrl: string;

  constructor(baseUrl = "") {
    this.routes = new Map();
    this.currentRoute = null;
    this._baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  get params(): StringRecord {
    return this.currentRoute?.params ?? {};
  }

  get route(): RouteMatch<Handler> | null {
    return this.currentRoute;
  }

  protected set route(newRoute: RouteMatch<Handler> | null) {
    this.currentRoute = newRoute;
  }

  get target(): Handler | undefined {
    return this.currentRoute?.handler;
  }

  /**
   * pathname을 가져오는 메서드 (자식 클래스에서 override)
   * @protected
   */
  protected abstract getPathname(url?: string): string;

  /**
   * 라우트 등록
   * @param path - 경로 패턴 (예: "/product/:id")
   * @param handler - 라우트 핸들러
   */
  addRoute(path: string, handler: Handler): void {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.baseUrl}${regexPath}$`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * 라우트 찾기 (자식 클래스에서 사용 가능)
   * @protected
   */
  protected findRoute(url?: string): RouteMatch<Handler> | null {
    const pathname = this.getPathname(url);
    for (const [routePath, route] of this.routes) {
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

  /**
   * 라우터 시작
   */
  start(): void {
    this.currentRoute = this.findRoute();
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param search - 쿼리 문자열
   * @returns 파싱된 쿼리 객체
   */
  static parseQuery(search: string): StringRecord {
    const params = new URLSearchParams(search);
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  /**
   * 객체를 쿼리 문자열로 변환
   * @param query - 쿼리 객체
   * @returns 쿼리 문자열
   */
  static stringifyQuery(query: QueryPayload): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }
}
