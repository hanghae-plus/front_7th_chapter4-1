import { ServerRouter } from "./lib/ServerRouter.js";
import { BASE_URL } from "./constants.js";
import { homeLoader, productDetailLoader } from "./loaders/index.js";
import { renderHomePage, renderProductDetailPage } from "./renderers/index.js";

// 라우트 설정: 경로, 로더, 렌더러를 매핑
const routes = [
  {
    path: "/",
    loader: homeLoader,
    renderer: renderHomePage,
  },
  {
    path: "/product/:id/",
    loader: productDetailLoader,
    renderer: renderProductDetailPage,
  },
];

// 서버 라우터 초기화 및 라우트 등록
const serverRouter = new ServerRouter(BASE_URL);
routes.forEach(({ path, loader }) => {
  serverRouter.addRoute(path, loader);
});
serverRouter.addRoute(".*", () => null); // 404용 catch-all

/**
 * 404 페이지 렌더링
 */
function render404() {
  return {
    head: `<title>404 | 쇼핑몰</title>`,
    html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-gray-600 mb-4">페이지를 찾을 수 없습니다.</p>
        <a href="/" data-link class="text-blue-600 hover:underline">홈으로 돌아가기</a>
      </div>
    </div>`,
    __INITIAL_DATA__: {},
  };
}

export const render = async (url, query = {}) => {
  // URL에서 쿼리 파싱 (query 파라미터가 없는 경우)
  const parsedQuery = Object.keys(query).length > 0 ? query : ServerRouter.parseQueryFromUrl(url);

  // 라우트 매칭
  const { route, params, handler, matched } = serverRouter.match(url, parsedQuery);

  console.log("SSR Match:", { url, route, params, query: parsedQuery, matched });

  // 404 처리
  if (!matched || !handler) {
    return render404();
  }

  // 해당 라우트의 설정 찾기
  const routeConfig = routes.find((r) => r.path === route);

  if (!routeConfig) {
    console.warn(`No route config found for ${route}`);
    return render404();
  }

  try {
    // 1. 로더 실행: 데이터 패칭
    console.log(`Loading data for ${route}...`);
    const data = await handler(parsedQuery, params);

    // 2. 렌더러 실행: HTML 생성
    console.log(`Rendering ${route}...`);
    const { head, html } = routeConfig.renderer(data);

    return {
      head,
      html,
      __INITIAL_DATA__: data,
    };
  } catch (error) {
    console.error(`Error rendering ${route}:`, error);

    // 에러 발생 시 에러 페이지 반환
    return {
      head: `<title>오류 발생 | 쇼핑몰</title>`,
      html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">오류 발생</h1>
          <p class="text-gray-600 mb-4">${error.message}</p>
          <a href="/" data-link class="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </div>
      </div>`,
      __INITIAL_DATA__: {},
    };
  }
};
