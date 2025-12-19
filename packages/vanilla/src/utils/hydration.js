import { isClient } from "../constants";
import { productStore, cartStore, PRODUCT_ACTIONS, CART_ACTIONS } from "../stores";

/**
 * 서버에서 전달받은 초기 데이터를 클라이언트 스토어에 적용
 * SSR로 렌더링된 페이지가 클라이언트에서 동일한 상태로 시작하도록 함
 *
 * @returns {boolean} 하이드레이션 성공 여부
 */
export function hydrateStoreFromSSR() {
  // 서버 환경에서는 실행하지 않음
  if (!isClient) {
    return false;
  }

  // 서버에서 주입한 초기 데이터 확인
  const initialData = window.__INITIAL_DATA__;
  if (!initialData || typeof initialData !== "object") {
    return false;
  }

  try {
    // 상품 목록 및 카테고리 데이터 복원
    const hasProductData = initialData.products || initialData.categories || initialData.totalCount !== undefined;
    if (hasProductData) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: initialData.products ?? [],
          categories: initialData.categories ?? {},
          totalCount: initialData.totalCount ?? 0,
          loading: false, // 하이드레이션 시 로딩 상태를 false로 설정
          error: null,
          status: "done",
        },
      });
    }

    // 현재 상품 정보 복원 (상품 상세 페이지용)
    if (initialData.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: initialData.currentProduct,
      });
      // 상품 상세 페이지 하이드레이션 시 로딩 상태를 false로 설정
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_LOADING,
        payload: false,
      });
    }

    // 관련 상품 정보 복원
    if (initialData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initialData.relatedProducts,
      });
    }

    // 장바구니 데이터 복원
    if (initialData.cartItems) {
      cartStore.dispatch({
        type: CART_ACTIONS.LOAD_FROM_STORAGE,
        payload: {
          items: initialData.cartItems,
          selectedAll: initialData.cartSelectedAll ?? false,
        },
      });
    }

    // 초기 데이터 정리 (메모리 누수 방지)
    removeInitialData();
    return true;
  } catch (error) {
    console.error("하이드레이션 실패:", error);
    removeInitialData();
    return false;
  }
}

/**
 * 전역 객체에서 초기 데이터 제거
 * 하이드레이션 후에는 더 이상 필요하지 않으므로 정리
 */
function removeInitialData() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    try {
      delete window.__INITIAL_DATA__;
    } catch {
      // delete가 실패하는 경우(일부 환경) undefined로 설정
      window.__INITIAL_DATA__ = undefined;
    }
  }
}

/**
 * 스토어에 유효한 데이터가 로드되어 있는지 확인
 *
 * @returns {boolean} 데이터 존재 여부
 */
export function hasStoreData() {
  const state = productStore.getState();
  const hasData = state.status !== "idle" && (state.products.length > 0 || state.currentProduct);
  return hasData;
}

/**
 * 홈 페이지에 필요한 데이터가 준비되었는지 확인
 * 상품 목록이 있어야 홈 페이지를 렌더링할 수 있음
 *
 * @returns {boolean} 홈 페이지 데이터 준비 여부
 */
export function hasHomePageData() {
  const state = productStore.getState();
  return state.status !== "idle" && state.products.length > 0;
}

/**
 * 특정 상품의 상세 데이터가 로드되어 있는지 확인
 *
 * @param {string} productId - 확인할 상품 ID
 * @returns {boolean} 해당 상품의 상세 데이터 존재 여부
 */
export function hasProductDetailData(productId) {
  const state = productStore.getState();
  return state.currentProduct?.productId === productId;
}

/**
 * 카테고리 데이터가 로드되어 있는지 확인
 *
 * @returns {boolean} 카테고리 데이터 존재 여부
 */
export function hasCategoryData() {
  const state = productStore.getState();
  return !!(state.categories && Object.keys(state.categories).length > 0);
}
