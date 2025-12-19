/**
 * 서버 사이드용 라우터
 * window 객체 없이 동작합니다
 */
export class RouterServer {
  #routes;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames = [];
    let regexPath;

    if (path === ".*") {
      // catch-all 패턴
      regexPath = ".*";
    } else {
      // 파라미터 추출 및 정규식으로 변환
      regexPath = path
        .replace(/:\w+/g, (match) => {
          paramNames.push(match.slice(1)); // ':id' -> 'id'
          return "([^/]+)";
        })
        .replace(/\//g, "\\/");
    }

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
      path,
    });
  }

  /**
   * URL에서 라우트 찾기
   * @param {string} pathname - 경로명
   * @returns {Object|null} 매칭된 라우트 정보
   */
  findRoute(pathname) {
    // pathname 정규화
    let normalizedPathname = pathname.replace(/\/+/g, "/");
    if (!normalizedPathname.startsWith("/")) {
      normalizedPathname = "/" + normalizedPathname;
    }

    // 라우트를 순회하며 매칭 시도 (.* 는 마지막에 확인)
    const catchAllRoute = Array.from(this.#routes.entries()).find(([path]) => path === ".*");
    const otherRoutes = Array.from(this.#routes.entries()).filter(([path]) => path !== ".*");

    // 일반 라우트 먼저 확인
    for (const [routePath, route] of otherRoutes) {
      const match = normalizedPathname.match(route.regex);
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

    // 일반 라우트가 매칭되지 않았고 catch-all이 있으면 사용
    if (catchAllRoute) {
      const [routePath, route] = catchAllRoute;
      // catch-all은 항상 매칭 (다른 라우트가 매칭되지 않은 경우에만)
      return {
        ...route,
        params: {},
        path: routePath,
      };
    }

    return null;
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery(search = "") {
    if (!search) return {};
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }
}
