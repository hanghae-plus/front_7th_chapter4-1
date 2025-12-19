import type { FunctionComponent } from "react";
import type { StringRecord } from "../types";

interface Route {
  regex: RegExp;
  paramNames: string[];
  handler: FunctionComponent;
  params?: StringRecord;
}

export class ServerRouter {
  readonly #routes: Map<string, Route>;
  readonly #baseUrl: string;

  #route: (Route & { params: StringRecord; path: string }) | null = null;
  #query: StringRecord = {};

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get query(): StringRecord {
    return this.#query;
  }

  set query(newQuery: StringRecord) {
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

  subscribe = () => {
    return () => {};
  };

  addRoute(path: string, handler: FunctionComponent) {
    const paramNames: string[] = [];

    // catch-all 라우트는 특별 처리
    if (path === ".*") {
      this.#routes.set(path, {
        regex: new RegExp(`^${this.#baseUrl}.*$`),
        paramNames: [],
        handler,
      });
      return;
    }

    let regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // "/" 라우트는 baseUrl만 매칭하도록 (선택적 trailing slash 포함)
    if (path === "/") {
      regexPath = "\\/?";
    }

    // trailing slash를 선택적으로 만듦
    if (regexPath.endsWith("\\/")) {
      regexPath = regexPath.slice(0, -2) + "\\/?";
    }

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  navigate(url: string, query: StringRecord = {}) {
    this.#query = query;
    let pathname = url.split("?")[0];

    // 마지막 / 제거 (baseUrl만 있거나 루트 경로가 아닌 경우)
    if (pathname.endsWith("/") && pathname !== "/") {
      pathname = pathname.slice(0, -1);
    }

    // .* (catch-all) 라우트는 마지막에 확인
    let catchAllRoute: [string, Route] | null = null;

    for (const [routePath, route] of this.#routes) {
      // catch-all 라우트는 건너뛰고 나중에 확인
      if (routePath === ".*") {
        catchAllRoute = [routePath, route];
        continue;
      }

      const match = pathname.match(route.regex);
      if (match) {
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        this.#route = {
          ...route,
          params,
          path: routePath,
        };
        return;
      }
    }

    // 다른 라우트가 매칭되지 않으면 catch-all 확인
    if (catchAllRoute) {
      const [routePath, route] = catchAllRoute;
      const match = pathname.match(route.regex);
      if (match) {
        this.#route = {
          ...route,
          params: {},
          path: routePath,
        };
        return;
      }
    }

    this.#route = null;
  }

  push() {}
  start() {}
}
