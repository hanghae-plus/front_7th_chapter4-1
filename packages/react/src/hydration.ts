import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import type { HomePageData, ProductDetailData } from "./ssr-helpers";

// 전역 타입 선언
declare global {
  interface Window {
    __INITIAL_DATA__?: HomePageData | ProductDetailData;
  }
}

// 서버에서 전달된 초기 데이터로 클라이언트 스토어를 복원
export function hydrateFromServerData() {
  const initialData = window.__INITIAL_DATA__;

  if (!initialData) {
    return;
  }

  // 홈페이지 데이터
  if ("products" in initialData && "categories" in initialData) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products,
        categories: initialData.categories,
        totalCount: initialData.totalCount,
        loading: false,
        error: null,
        status: "done",
      },
    });
  }

  // 상품 상세 데이터
  else if ("product" in initialData) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        currentProduct: initialData.product,
        relatedProducts: initialData.relatedProducts,
        loading: false,
        error: null,
        status: "done",
      },
    });
  }

  // 초기 데이터 사용 후 제거
  delete window.__INITIAL_DATA__;
}
