import { server } from "./mocks/node.js";
import { getCategories, getProduct, getProducts } from "./api/productApi.js";
import { productStore, initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

// MSW 서버 초기화 (한 번만 실행)
let mswInitialized = false;
function initializeMSW() {
  if (!mswInitialized) {
    server.listen({ onUnhandledRequest: "bypass" });
    mswInitialized = true;
  }
}

/**
 * 서버 사이드에서 라우트 매칭
 * 클라이언트 Router와 동일한 로직이지만 window 객체 없이 동작
 */
function matchRoute(url, baseUrl) {
  // baseUrl 제거
  let pathname = url;
  if (baseUrl && pathname.startsWith(baseUrl)) {
    pathname = pathname.slice(baseUrl.length);
  }
  pathname = pathname.split("?")[0]; // 쿼리 제거
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  // 홈페이지
  if (pathname === "/" || pathname === "") {
    return { path: "/", params: {}, handler: "HomePage" };
  }

  // 상품 상세 페이지: /product/:id/
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return {
      path: "/product/:id/",
      params: { id: productMatch[1] },
      handler: "ProductDetailPage",
    };
  }

  // 404
  return { path: null, params: {}, handler: "NotFoundPage" };
}

/**
 * 서버 사이드 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 쿼리 파라미터 객체
 * @returns {Promise<{html: string, initialState: Object}>}
 */
export const render = async (url, query = {}) => {
  try {
    // MSW 서버 초기화
    initializeMSW();

    // baseUrl 설정 (프로덕션/개발 환경에 따라)
    const baseUrl = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/vanilla/" : "/";

    // 라우트 매칭
    const route = matchRoute(url, baseUrl);

    // 스토어 초기화 (매 요청마다 새로 생성)
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { ...initialProductState },
    });

    // 라우트에 따라 데이터 프리페칭
    if (route.handler === "HomePage") {
      // 홈페이지: 상품 목록과 카테고리 로드
      const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsResponse.products,
          categories,
          totalCount: productsResponse.pagination.total,
          loading: false,
          status: "done",
        },
      });
    } else if (route.handler === "ProductDetailPage") {
      // 상품 상세 페이지: 상품 상세 정보 로드
      const productId = route.params.id;
      const product = await getProduct(productId);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품 로드 (같은 category2 기준)
      if (product.category2) {
        try {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          const relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: relatedProducts,
          });
        } catch (error) {
          // 관련 상품 로드 실패는 조용히 처리
          console.error("관련 상품 로드 실패:", error);
        }
      }
    }

    // 현재 스토어 상태를 initialState로 추출
    const currentState = productStore.getState();
    const initialState = {
      productStore: currentState,
    };

    // 디버깅용 로그
    console.log(`[SSR] 라우트: ${route.path || "404"}`);
    console.log(`[SSR] 데이터 프리페칭 완료:`);
    if (route.handler === "HomePage") {
      console.log(`  - 상품 개수: ${currentState.products.length}`);
      console.log(`  - 전체 개수: ${currentState.totalCount}`);
      console.log(`  - 카테고리 개수: ${Object.keys(currentState.categories).length}`);
    } else if (route.handler === "ProductDetailPage") {
      console.log(`  - 상품 ID: ${currentState.currentProduct?.productId}`);
      console.log(`  - 관련 상품 개수: ${currentState.relatedProducts.length}`);
    }

    // 임시로 빈 HTML 반환 (다음 단계에서 실제 렌더링 구현)
    return {
      html: `<div>라우트 매칭 완료: ${route.path || "404"}, 파라미터: ${JSON.stringify(route.params)}</div>`,
      initialState,
    };
  } catch (error) {
    console.error("서버 렌더링 오류:", error);
    return {
      html: '<div class="p-4 text-red-600">서버 렌더링 중 오류가 발생했습니다.</div>',
      initialState: {},
    };
  }
};
