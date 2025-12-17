/**
 * BaseRouter - 환경 독립적인 라우팅 코어
 * 브라우저와 Node.js 모두에서 동작하는 라우트 매칭 로직
 */
export class BaseRouter {
  #routes;
  #route;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
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

  /**
   * 라우트 등록 (환경 독립적)
   * @param {string} path - 경로 패턴 (예: "/product/:id/")
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
   * URL과 매칭되는 라우트 찾기 (환경 독립적)
   * @param {string} url - 매칭할 URL
   * @returns {Object|null} 매칭된 라우트 정보 또는 null
   */
  findRoute(url) {
    // URL에서 pathname 추출
    let pathname;
    try {
      // Node.js 환경에서도 안전하게 URL 파싱
      const urlObj = new URL(url, "http://localhost");
      pathname = urlObj.pathname;
    } catch {
      // 단순 경로 문자열인 경우 쿼리 제거
      pathname = url.split("?")[0];
    }

    // 등록된 라우트와 매칭
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
   * 내부 라우트 상태 업데이트
   * @protected
   */
  _setRoute(route) {
    this.#route = route;
  }

  /**
   * 쿼리 파라미터를 객체로 파싱 (환경 독립적)
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery(search = "") {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  /**
   * 객체를 쿼리 문자열로 변환 (환경 독립적)
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }
}
