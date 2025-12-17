import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { BASE_URL } from "./constants.js";
import { router } from "./router";

// 서버 환경에서 라우트 등록
router.addRoute("/", HomePage);
router.addRoute("/product/:id", ProductDetailPage);

// 서버 사이드 라우트 매칭 함수
function findRoute(url, baseUrl = "") {
  const pathname = url.split("?")[0]; // 쿼리 제거
  const cleanPath = pathname.replace(baseUrl, "").replace(/\/$/, "") || "/";

  // 라우트 패턴 매칭
  const routes = [
    { pattern: "/", handler: HomePage },
    { pattern: "/product/:id", handler: ProductDetailPage },
  ];

  for (const route of routes) {
    const paramNames = [];
    const regexPath = route.pattern
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);
    const match = cleanPath.match(regex);

    if (match) {
      const params = {};
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      return {
        handler: route.handler,
        params,
      };
    }
  }

  // 매칭되는 라우트가 없으면 NotFoundPage
  return {
    handler: NotFoundPage,
    params: {},
  };
}

/**
 * 서버 사이드 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 쿼리 파라미터 객체 (나중에 라우터 구성 시 사용 예정)
 * @returns {Promise<string>} 렌더링된 HTML 문자열
 */

export const render = async (url, query = {}) => {
  try {
    // BASE_URL 제거
    const cleanUrl = url.replace(BASE_URL, "").replace(/\/$/, "") || "/";

    // 라우트 찾기
    const route = findRoute(cleanUrl, BASE_URL);

    // 서버 환경에서 router 객체 설정
    // router.setServerRoute를 사용하여 query와 params 설정
    router.setServerRoute(cleanUrl, query, route.params);

    // 페이지 컴포넌트 실행
    const html = route.handler();

    return html || "";
  } catch (error) {
    console.error("SSR Render Error:", error);
    // 에러 발생 시 기본 페이지 반환
    return NotFoundPage();
  }
};
