/**
 * SSR 렌더링 엔트리 포인트
 *
 * SSR 흐름:
 * 1. 요청 URL을 파싱하여 라우트 매칭
 * 2. 매칭된 라우트에 필요한 데이터를 프리페칭
 * 3. 스토어에 데이터를 설정하고 컴포넌트 렌더링
 * 4. 생성된 HTML과 초기 데이터를 반환
 *
 * 참고: /packages/vanilla/src/main-server.js
 */
import { renderToString } from "react-dom/server";
import { ServerRouter } from "./router/serverRouter";
import { SSRRouterProvider } from "./router/RouterContext";
import { mockGetProducts, mockGetProduct, mockGetCategories } from "./mocks/mockApi";
import { createProductStore, ssrContext, PRODUCT_ACTIONS } from "./entities/products/productStore";
import { HomePage, ProductDetailPage } from "./pages";
import { App } from "./App";

// SSG에서 상품 목록을 가져오기 위해 re-export
export { mockGetProducts };

/**
 * 서버 라우터 설정
 */
function createServerRouter() {
  const router = new ServerRouter();
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  return router;
}

/**
 * 데이터 프리페칭
 */
async function prefetchData(path: string | null, params: Record<string, string>, query: Record<string, string>) {
  // 홈페이지: 상품 목록 + 카테고리
  if (path === "/") {
    const { products, pagination } = mockGetProducts({
      search: query.search,
      category1: query.category1,
      category2: query.category2,
      sort: query.sort,
      limit: query.limit ? Number(query.limit) : undefined,
    });
    const categories = mockGetCategories();

    return {
      products,
      categories,
      totalCount: pagination.total,
      loading: false,
      status: "done",
    };
  }

  // 상품 상세: 상품 정보 + 관련 상품
  if (path === "/product/:id/") {
    const currentProduct = mockGetProduct(params.id);

    if (!currentProduct) {
      return { error: "상품을 찾을 수 없습니다", loading: false, status: "done" };
    }

    const { products } = mockGetProducts({ category1: currentProduct.category1 });
    const relatedProducts = products.filter((p) => p.productId !== params.id);

    return {
      currentProduct,
      relatedProducts,
      loading: false,
      status: "done",
    };
  }

  return { loading: false, status: "done" };
}

/**
 * 페이지 타이틀 생성
 */
function generateTitle(path: string | null, initialData: Record<string, unknown>): string {
  if (path === "/product/:id/" && initialData.currentProduct) {
    const product = initialData.currentProduct as { title: string };
    return `${product.title} - 쇼핑몰`;
  }
  return "쇼핑몰 - 홈";
}

/**
 * 메인 렌더링 함수
 */
export async function render(url: string, query: Record<string, string> = {}) {
  // 1. 요청별 독립 스토어 생성
  const store = createProductStore();
  ssrContext.store = store;

  try {
    // 2. URL 라우팅
    const router = createServerRouter();
    const matchedRoute = router.match(url);

    // 3. 데이터 프리페칭
    const initialData = matchedRoute
      ? await prefetchData(matchedRoute.path, matchedRoute.params, query)
      : { loading: false, status: "done" };

    // 4. 스토어에 프리페칭된 데이터 설정
    store.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    // 5. SSR 라우트 정보 생성 (쿼리 파라미터 포함)
    const ssrRoute = matchedRoute
      ? {
          handler: matchedRoute.handler,
          params: matchedRoute.params,
          path: matchedRoute.path,
          query,
        }
      : null;

    // 6. React 컴포넌트 렌더링 (SSRRouterProvider로 라우트 정보와 스토어 전달)
    const html = renderToString(
      <SSRRouterProvider route={ssrRoute} store={store}>
        <App />
      </SSRRouterProvider>,
    );

    // 7. SEO용 head 태그 생성
    const title = generateTitle(matchedRoute?.path ?? null, initialData);
    const head = `<title>${title}</title>`;

    // 8. 결과 반환
    return { html, head, initialData };
  } finally {
    // 9. SSR 컨텍스트 정리 (메모리 누수 방지)
    ssrContext.store = null;
  }
}
