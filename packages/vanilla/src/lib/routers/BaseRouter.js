import { createObserver } from "../createObserver.js";

export class BaseRouter {
  #routes;
  #observer = createObserver();
  #baseUrl;
  #route;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
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

  get baseUrl() {
    return this.#baseUrl;
  }

  get routes() {
    return this.#routes;
  }

  subscribe = this.#observer.subscribe;

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

  start() {
    this.#route = this.findRoute();
    this.#observer.notify();
  }

  findRoute(pathname) {
    const targetPathname = pathname ?? this.pathname;

    for (const [routePath, route] of this.#routes) {
      const match = targetPathname.match(route.regex);
      if (!match) {
        continue;
      }

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
    return null;
  }

  setRoute(route) {
    this.#route = route;
  }

  notify() {
    this.#observer.notify();
  }

  static parseQuery = (search) => {
    const params = new URLSearchParams(search || "");
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static stringifyQuery = (query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };
}
