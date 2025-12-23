import { createObserver } from "../createObserver";
import type { AnyFunction } from "../../types";
import type { Runtime, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
  meta?: Record<string, unknown>;
  path: string;
}

type QueryPayload = Record<string, string | number | undefined>;

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Router<Handler extends (...args: any[]) => any> {
  readonly #routes: Route<Handler>[] = [];
  readonly #observer = createObserver();
  readonly #baseUrl;
  readonly #runtime: Runtime;
  #location = { pathname: "/", search: "" }; // internal "source of truth"
  #route: Route<Handler> | null = null;

  constructor(runtime: Runtime, baseUrl = "") {
    if (!runtime || typeof runtime.getHref !== "function") {
      throw new Error("Router requires a runtime with getHref()");
    }

    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#runtime = runtime;

    if (typeof runtime.onChange === "function") {
      runtime.onChange(() => {
        this.sync();
      });
    }

    if (typeof runtime.setupClickHandler === "function") {
      runtime.setupClickHandler((url: string) => {
        this.push(url);
      });
    }
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query(): StringRecord {
    return Router.parseQuery(this.#location.search);
  }

  set query(newQuery: QueryPayload) {
    // const newUrl = Router.getUrl(newQuery, this.#baseUrl);
    // this.push(newUrl);
    const current = this.query;
    const merged = { ...current, ...newQuery };
    for (const k of Object.keys(merged)) {
      if (merged[k] === null || merged[k] === undefined || merged[k] === "") delete merged[k];
    }
    const qs = Router.stringifyQuery(merged);
    const href = `${this.#baseUrl}${this.#location.pathname}${qs ? `?${qs}` : ""}`;
    this.push(href);
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

  subscribe(fn: () => void) {
    return this.#observer.subscribe(fn);
  }

  addRoute(pathPattern: string, handler: Handler, meta = {}) {
    const compiled = Router.compilePath(pathPattern);
    this.#routes.push({
      regex: compiled.regex,
      paramNames: compiled.paramNames,
      handler,
      meta,
      params: {},
      path: pathPattern,
    });
  }

  #match(pathname: string): Route<Handler> | null {
    for (const r of this.#routes) {
      const match = pathname.match(r.regex);
      if (!match) continue;

      const params: StringRecord = {};
      r.paramNames.forEach((name, idx) => {
        params[name] = decodeURIComponent(match[idx + 1]);
      });

      return {
        path: r.path,
        handler: r.handler,
        meta: r.meta,
        params,
        regex: r.regex,
        paramNames: r.paramNames,
      };
    }
    return null;
  }

  push(url: string) {
    const normalizedHref = Router.ensureStartsWithBase(url, this.#baseUrl);
    if (typeof this.#runtime.push === "function") {
      this.#runtime.push(normalizedHref);
      // pushState doesn't trigger popstate, so we sync manually
      this.sync(normalizedHref);
    } else {
      // server/no-push: just update internal snapshot
      this.sync(normalizedHref);
    }
  }

  start() {
    this.sync();
  }

  /**
   * Sync core state with runtime URL or provided href
   */
  sync(href?: string) {
    const rawHref = href ?? this.#runtime.getHref();
    const loc = Router.parseHref(rawHref, this.#baseUrl);
    this.#location = loc;

    this.#route = this.#match(loc.pathname);
    this.#observer.notify();
  }

  static normalizeBase(baseUrl = "") {
    if (!baseUrl) return "";
    // ensure starts with "/" and no trailing slash
    const b = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
    return b.replace(/\/$/, "");
  }

  static ensureStartsWithBase(href: string, baseUrl: string) {
    if (!baseUrl) return href.startsWith("/") ? href : `/${href}`;
    if (href.startsWith(baseUrl)) return href;
    // if href is "/x", make it "/base/x"
    if (href.startsWith("/")) return `${baseUrl}${href}`;
    return `${baseUrl}/${href}`;
  }

  /**
   * Parse href into { pathname, search } normalized for matching:
   * - remove baseUrl prefix from pathname for matching (core matches "app path")
   * - normalize "" -> "/"
   * - normalize trailing slash: remove (except root)
   */
  static parseHref(href: string, baseUrl: string) {
    const safe = href || "/";
    const [pathPart, queryPart = ""] = safe.split("?");
    let pathname = pathPart || "/";
    // remove baseUrl prefix from pathname (so core routes are app-local)
    if (baseUrl && pathname.startsWith(baseUrl)) {
      pathname = pathname.slice(baseUrl.length) || "/";
    }
    // normalize empty
    if (pathname === "") pathname = "/";
    // normalize trailing slash (except "/")
    if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
    const search = queryPart ? `?${queryPart}` : "";
    return { pathname, search };
  }

  static parseQuery = (search: string) => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
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

  static compilePath(pathPattern: string): { regex: RegExp; paramNames: string[] } {
    // Handle catch-all patterns
    if (pathPattern === "*" || pathPattern === ".*") {
      return {
        regex: /^.*$/,
        paramNames: [],
      };
    }

    let p = pathPattern.startsWith("/") ? pathPattern : `/${pathPattern}`;
    if (p.length > 1) p = p.replace(/\/+$/, "");

    const paramNames: string[] = [];
    const regexPath = p
      .replace(/:\w+/g, (m) => {
        paramNames.push(m.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    return {
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
    };
  }
}
