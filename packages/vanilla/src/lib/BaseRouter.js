export class BaseRouter {
  #routes;
  #baseUrl;
  #params = {};
  #route = null;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }
  /** 현재 파라미터 */
  get params() {
    return this.#params;
  }
  /** 현재 라우트 */
  get route() {
    return this.#route;
  }

  /** 현재 핸들러 */
  get target() {
    return this.#route?.handler;
  }

  _setRoute(newRoute) {
    this.#route = newRoute;
    this.#params = newRoute?.params ?? {};
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
  /**
   *
   * @param {string} url - 경로
   * @returns {Object|null} 매치된 라우트 정보 // params와 path 항상 포함
   */
  findRoute(url = this.#baseUrl) {
    const dummyUrl = "http://localhost";
    const { pathname } = new URL(url, dummyUrl);

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
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search) => {
    const params = new URLSearchParams(search);
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
}
