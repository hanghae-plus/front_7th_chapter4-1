export class ServerRouter {
  #routes;
  #route;
  #params;
  #query;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#params = {};
    this.#query = {};
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return this.#query;
  }

  get params() {
    return this.#params;
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
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

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  match(url, query = {}) {
    const pathname = url.split("?")[0];

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        this.#route = route;
        this.#params = params;
        this.#query = query;

        return {
          path: routePath,
          params,
          handler: route.handler,
        };
      }
    }
    return null;
  }
}
