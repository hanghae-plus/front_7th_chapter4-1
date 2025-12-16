/**
 * 서버 사이드 라우터
 * - 클라이언트 Router와 달리 window 객체를 사용하지 않음
 * - URL을 파라미터로 받아서 라우트 매칭만 수행
 *
 * 참고: src/lib/Router.js의 addRoute, #findRoute 메서드
 */
export class ServerRouter {
  #routes = new Map();
  #baseUrl;

  constructor(baseUrl = "") {
    // baseUrl 저장 (끝의 슬래시 제거)
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id/")
   * @param {Function} handler - 라우트 핸들러 (페이지 컴포넌트)
   *
   * 예시:
   *   addRoute("/", HomePage)
   *   addRoute("/product/:id/", ProductDetailPage)
   */
  addRoute(path, handler) {
    // 1. :param 패턴을 찾아서 paramNames 배열에 저장
    const paramNames = [];

    // 2. :param을 ([^/]+) 정규식으로 변환
    // 3. 슬래시를 이스케이프 (/ → \/)
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // 4. 정규식 객체 생성하여 routes에 저장
    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);
    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * URL과 매칭되는 라우트 찾기
   * @param {string} url - 매칭할 URL (예: "/product/123/")
   * @returns {{ handler: Function, params: Object, path: string } | null}
   *
   * 예시:
   *   match("/product/123/")
   *   → { handler: ProductDetailPage, params: { id: "123" }, path: "/product/:id/" }
   */
  match(url) {
    // 1. URL에서 쿼리스트링 제거 (? 이후)
    const pathname = url.split("?")[0];

    // 2. 등록된 라우트들을 순회하며 매칭
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);

      // 3. 매칭되면 params 객체 생성하여 반환
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

    // 4. 매칭 안되면 null 반환
    return null;
  }
}
