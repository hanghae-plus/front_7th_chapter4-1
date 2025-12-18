/**
 * 서버 사이드 렌더링용 라우터
 * URL 패턴 매칭 및 파라미터 추출을 담당
 */
export class ServerRouter {
  constructor() {
    this.routes = [];
  }

  /**
   * 라우트 추가
   * @param {string} path - 경로 패턴 (예: "/product/:id/")
   * @param {string} handler - 페이지 식별자
   */
  addRoute(path, handler) {
    // :param 형태를 정규식으로 변환
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });

    this.routes.push({
      path,
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
      handler,
    });
  }

  /**
   * URL과 매칭되는 라우트 찾기
   * @param {string} url - URL 경로
   * @returns {{ handler: string, params: Object, path: string } | null}
   */
  findRoute(url) {
    // URL에서 경로만 추출 (쿼리스트링 제거)
    const pathname = url.split("?")[0];

    for (const route of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // params 객체 생성
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          handler: route.handler,
          params,
          path: route.path,
        };
      }
    }

    return null;
  }
}
