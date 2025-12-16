/**
 * 서버 사이드 라우터
 * window 의존성 없이 순수하게 URL 매칭만 수행
 */
export class ServerRouter {
  #routes;
  #baseUrl;
  #currentRoute;
  #currentQuery;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#currentRoute = null;
    this.#currentQuery = {};
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return this.#currentQuery;
  }

  get params() {
    return this.#currentRoute?.params ?? {};
  }

  get route() {
    return this.#currentRoute;
  }

  get target() {
    return this.#currentRoute?.handler;
  }

  // 클라이언트 API 호환용 (서버에서는 아무것도 안함)
  subscribe() {}
  push() {}
  start() {}
  hydrate() {}

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id", ".*")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    const paramNames = [];
    let regex;

    // ".*" 같은 정규식 패턴인 경우
    if (path.startsWith(".*") || path.startsWith("*")) {
      // catch-all 패턴: 모든 경로 매칭
      regex = new RegExp(".*");
    } else {
      // 일반 경로 패턴을 정규식으로 변환
      const regexPath = path
        .replace(/:\w+/g, (match) => {
          paramNames.push(match.slice(1)); // ':id' -> 'id'
          return "([^/]+)";
        })
        .replace(/\//g, "\\/");

      // ServerRouter는 이미 base path가 제거된 URL을 받으므로 baseUrl을 포함하지 않음
      regex = new RegExp(`^${regexPath}$`);
    }

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * URL 매칭 (서버용)
   * @param {string} url - 매칭할 URL
   * @param {Object} query - 쿼리 파라미터
   * @returns {Object|null} 매칭된 라우트 정보
   */
  match(url, query = {}) {
    // URL 객체 생성 (origin은 임의로 설정, pathname만 필요)
    const pathname = new URL(url, "http://localhost").pathname;

    // 현재 쿼리 설정
    this.#currentQuery = query;

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        // 현재 라우트 설정
        this.#currentRoute = {
          ...route,
          params,
          path: routePath,
        };

        return this.#currentRoute;
      }
    }

    this.#currentRoute = null;
    return null;
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - 쿼리 문자열
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
}
