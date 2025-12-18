/**
 * SSR 렌더링 엔트리 포인트
 *
 * SSR(Server-Side Rendering) 흐름:
 * 1. 요청 URL을 파싱하여 라우트 매칭
 * 2. 매칭된 라우트에 필요한 데이터를 프리페칭
 * 3. 스토어에 데이터를 설정하고 컴포넌트 렌더링
 * 4. 생성된 HTML과 초기 데이터를 반환
 *
 * 클라이언트에서는 window.__INITIAL_DATA__로 전달받아
 * 동일한 데이터로 Hydration을 수행합니다.
 */
import { ServerRouter } from "./router/serverRouter.js";
import { mockGetProducts, mockGetProduct, mockGetCategories } from "./mocks/mockApi.js";
import { Router } from "./lib/Router.js";
import { createProductStore, ssrContext } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages/index.js";

// SSG에서 상품 목록을 가져오기 위해 re-export
export { mockGetProducts };

/**
 * 서버 라우터 설정
 *
 * 주의: server.js와 static-site-generate.js에서 base URL을 제거한 후
 * render()를 호출하므로, ServerRouter는 baseUrl 없이 생성합니다.
 * 예: "/front_7th_chapter4-1/vanilla/product/123/" → "/product/123/"
 */
function createServerRouter() {
  const router = new ServerRouter();
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  return router;
}

/**
 * 데이터 프리페칭
 *
 * 라우트별로 필요한 데이터를 미리 가져와서 반환합니다.
 * 반환된 데이터는 스토어에 설정되어 컴포넌트 렌더링에 사용됩니다.
 *
 * @param {string} path - 매칭된 라우트 경로 패턴 (예: "/", "/product/:id/")
 * @param {Object} params - URL 파라미터 (예: { id: "123" })
 * @param {Object} query - URL 쿼리 파라미터 (예: { search: "젤리", category1: "생활/건강" })
 * @returns {Object} 스토어에 설정될 초기 데이터
 */
async function prefetchData(path, params, query = {}) {
  // ============================================
  // 홈페이지: 상품 목록 + 카테고리 + 폼 초기값
  // ============================================
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
      // 상품 데이터
      products,
      categories,
      totalCount: pagination.total,
      // UI 상태: SSR에서는 데이터 로딩이 완료된 상태
      loading: false,
      // 폼 초기값: SSR HTML에서 input 값을 미리 채우기 위함
      // CSR에서는 router.query를 사용하지만, SSR에서는 router가 없으므로
      // 스토어에 저장하여 컴포넌트가 읽을 수 있게 함
      searchQuery: query.search || "",
      category1: query.category1 || "",
      category2: query.category2 || "",
      sort: query.sort || "price_asc",
      limit: query.limit ? Number(query.limit) : 20,
    };
  }

  // ============================================
  // 상품 상세: 상품 정보 + 관련 상품
  // ============================================
  if (path === "/product/:id/") {
    const currentProduct = mockGetProduct(params.id);

    // 상품이 없으면 에러 반환
    // ProductDetailPage는 데이터 존재 여부로 상태를 판단하므로
    // error만 설정하면 됨 (loading: false 불필요)
    if (!currentProduct) {
      return { error: "상품을 찾을 수 없습니다" };
    }

    // 관련 상품: 같은 카테고리의 다른 상품들
    const { products } = mockGetProducts({ category1: currentProduct.category1 });
    const relatedProducts = products.filter((p) => p.productId !== params.id);

    // ProductDetailPage는 currentProduct 존재 여부로 로딩 완료를 판단
    // 따라서 loading: false를 명시적으로 설정할 필요 없음
    return {
      currentProduct,
      relatedProducts,
    };
  }

  return {};
}

/**
 * SSR용 스토어 생성 및 컨텍스트 설정
 *
 * 각 SSR 요청마다 새로운 스토어 인스턴스를 생성하여
 * 동시 요청 간 상태 오염을 방지합니다.
 *
 * @returns {Object} 새로 생성된 스토어 인스턴스
 */
function createSSRStore() {
  const store = createProductStore();
  ssrContext.store = store;
  return store;
}

/**
 * SSR 컨텍스트 정리
 * 렌더링 완료 후 컨텍스트를 초기화합니다.
 */
function cleanupSSRContext() {
  ssrContext.store = null;
}

/**
 * URL에서 쿼리 문자열 추출
 * @param {string} url - 전체 URL (예: "/search?q=test&page=1")
 * @returns {string} 쿼리 문자열 (예: "?q=test&page=1") 또는 빈 문자열
 */
function extractQueryString(url) {
  const queryIndex = url.indexOf("?");
  return queryIndex !== -1 ? url.slice(queryIndex) : "";
}

/**
 * 페이지 타이틀 생성
 * @param {Object|null} matchedRoute - 매칭된 라우트 정보
 * @param {Object} initialData - 프리페칭된 데이터
 * @returns {string} 페이지 타이틀
 */
function generateTitle(matchedRoute, initialData) {
  // 상품 상세 페이지: 상품명 포함
  if (matchedRoute?.path === "/product/:id/" && initialData.currentProduct) {
    return `${initialData.currentProduct.title} - 쇼핑몰`;
  }
  // 기본 타이틀
  return "쇼핑몰 - 홈";
}

/**
 * 메인 렌더링 함수
 *
 * SSR의 핵심 함수로, URL을 받아 완성된 HTML과 초기 데이터를 반환합니다.
 * 각 요청마다 독립된 스토어 인스턴스를 사용하여 동시 요청 안전성을 보장합니다.
 *
 * @param {string} url - 요청 URL (base URL이 제거된 상태, 예: "/" 또는 "/product/123/")
 * @returns {Promise<{ html: string, head: string, initialData: Object }>}
 */
export async function render(url) {
  // Step 1: 요청별 독립 스토어 생성 (동시 요청 간 격리)
  const store = createSSRStore();

  try {
    // Step 2: URL 라우팅
    const router = createServerRouter();
    const matchedRoute = router.match(url);

    // Step 3: 쿼리 파라미터 파싱
    const queryString = extractQueryString(url);
    const query = Router.parseQuery(queryString);

    // Step 4: 데이터 프리페칭
    const initialData = matchedRoute ? await prefetchData(matchedRoute.path, matchedRoute.params, query) : {};

    // Step 5: 스토어에 프리페칭된 데이터 설정
    store.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    // Step 6: 페이지 컴포넌트 렌더링
    // 컴포넌트는 getActiveStore()를 통해 현재 SSR 스토어에 접근
    const PageComponent = matchedRoute?.handler || NotFoundPage;
    const html = PageComponent();

    // Step 7: SEO용 head 태그 생성
    const title = generateTitle(matchedRoute, initialData);
    const head = `<title>${title}</title>`;

    // Step 8: 결과 반환
    return { html, head, initialData };
  } finally {
    // Step 9: SSR 컨텍스트 정리 (메모리 누수 방지)
    cleanupSSRContext();
  }
}
