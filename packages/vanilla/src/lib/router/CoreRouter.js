/**
 * Global Core Router
 */
import { createObserver } from "../createObserver.js";

/**
 * Runtime Port (Adapter contract)
 * - getHref(): string  // e.g. "/product/1?sort=asc"
 * - push?(href: string): void
 * - onChange?(cb: () => void): () => void   // returns unsubscribe
 */
export class CoreRouter {
  #routes = [];
  #route;
  #observer = createObserver();
  #baseUrl;
  #runtime;
  #location = { pathname: "/", search: "" }; // internal "source of truth"

  constructor(runtime, baseUrl = "") {
    if (!runtime || typeof runtime.getHref !== "function") {
      throw new Error("CoreRouter requires a runtime with getHref()");
    }

    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#runtime = runtime;

    if (typeof runtime.onChange === "function") {
      runtime.onChange(() => {
        this.sync();
      });
    }
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return CoreRouter.parseQuery(this.#location.search);
  }

  set query(newQuery) {
    const current = this.query;
    const merged = { ...current, ...newQuery };
    for (const k of Object.keys(merged)) {
      if (merged[k] === null || merged[k] === undefined || merged[k] === "") delete merged[k];
    }
    const qs = CoreRouter.stringifyQuery(merged);
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

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(pathPattern, handler, meta = {}) {
    const compiled = CoreRouter.compilePath(pathPattern, this.#baseUrl);
    this.#routes.push({
      pathPattern,
      ...compiled,
      handler,
      meta,
    });
  }

  #match(pathname) {
    for (const r of this.#routes) {
      const match = pathname.match(r.regex);
      if (!match) continue;

      const params = {};
      r.paramNames.forEach((name, idx) => {
        params[name] = decodeURIComponent(match[idx + 1]);
      });

      return {
        path: r.pathPattern,
        handler: r.handler,
        meta: r.meta,
        params,
      };
    }
    return null;
  }

  /**
   * 네비게이션 실행
   * @param {string} url - 이동할 경로
   */
  push(url) {
    const normalizedHref = CoreRouter.ensureStartsWithBase(url, this.#baseUrl);
    if (typeof this.#runtime.push === "function") {
      this.#runtime.push(normalizedHref);
      // pushState doesn't trigger popstate, so we sync manually
      this.sync(normalizedHref);
    } else {
      // server/no-push: just update internal snapshot
      this.sync(normalizedHref);
    }
  }

  /**
   * 라우터 시작
   */
  start() {
    this.sync();
  }

  /**
   * Sync core state with runtime URL or provided href
   */
  sync(href) {
    const rawHref = href ?? this.#runtime.getHref();
    const loc = CoreRouter.parseHref(rawHref, this.#baseUrl);
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

  static ensureStartsWithBase(href, baseUrl) {
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
  static parseHref(href, baseUrl) {
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

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search) => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const query = {};
    for (const [k, v] of params) query[k] = v;
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery = (query) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query || {})) {
      if (v === null || v === undefined || v === "") continue;
      params.set(k, String(v));
    }
    return params.toString();
  };

  /**
   * Compile "/product/:id" to regex + paramNames.
   * Note: core matches app-local pathname (baseUrl removed already),
   * so regex should be built WITHOUT baseUrl.
   */
  static compilePath(pathPattern) {
    let p = pathPattern.startsWith("/") ? pathPattern : `/${pathPattern}`;
    if (p.length > 1) p = p.replace(/\/+$/, "");

    const paramNames = [];
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
