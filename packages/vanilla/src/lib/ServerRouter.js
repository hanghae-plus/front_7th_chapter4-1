/**
 * 서버용 라우터 클래스
 * 클라이언트 Router와 동일한 API를 제공하여 서버에서 라우팅을 처리
 */
export class ServerRouter {
  #routes;
  #route;
  #notFoundHandler;
  #createContext;
  _query;

  constructor(routes = null, createContext = null) {
    this.#routes = new Map();
    this.#route = null;
    this.#notFoundHandler = null;
    this.#createContext = createContext;
    this._query = {};
    if (routes) {
      this.addRoutes(routes);
    }
  }

  /**
   * routes 객체를 한 번에 등록
   * @param {Object} routes - 라우트 객체 { "/path": handler, "/product/:id": handler, "*": notFoundHandler }
   */
  addRoutes(routes) {
    for (const [path, handler] of Object.entries(routes)) {
      this.addRoute(path, handler);
    }
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // * 경로 처리 (와일드카드)
    if (path === "*") {
      this.#notFoundHandler = handler;
      return;
    }

    const paramNames = [];

    let regexPath = path
      .replace(/:(\w+)/g, (match, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * 내부: URL에 매칭되는 라우트 찾기
   * @param {string} url - 전체 URL 또는 pathname
   * @returns {Object|null}
   */
  #findRoute(url) {
    const { pathname } = new URL(url, `http://localhost`);

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

    if (this.#notFoundHandler) {
      return {
        handler: this.#notFoundHandler,
        params: {},
        path: "*",
      };
    }

    return null;
  }

  /**
   * URL에 매칭되는 라우트 찾기
   * @param {string} url - 매칭할 URL
   * @returns {Object|null} 매칭된 라우트와 매개변수, 또는 null
   */
  findRoute(url) {
    return this.#findRoute(url);
  }

  /**
   * 라우터 시작
   */
  start(pathname) {
    this.#route = this.#findRoute(pathname);
    if (this.#route && typeof this.#createContext === "function") {
      const ctx = this.#createContext();
      ctx.router = this;
      ctx.query = this.query; // router의 query를 ctx에도 설정
      // ctx를 params에 추가
      if (!this.#route.params) {
        this.#route.params = {};
      }
      this.#route.params.ctx = ctx;
    }
  }

  /** 현재 매칭된 라우트 반환 */
  get route() {
    return this.#route;
  }

  /** 현재 라우트의 핸들러(target) 반환 */
  get target() {
    return this.#route?.handler || null;
  }

  /** 현재 라우트의 파라미터 반환 */
  get params() {
    return this.#route?.params || {};
  }

  /** 쿼리 파라미터 (서버에서는 외부에서 설정) */
  get query() {
    return this._query || {};
  }

  set query(value) {
    this._query = value;
  }
}
