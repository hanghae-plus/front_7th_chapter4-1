import { createStore } from "../lib";
import { PRODUCT_ACTIONS } from "./actionTypes";

/**
 * 상품 스토어 초기 상태
 */
export const initialProductState = {
  // 상품 목록
  products: [],
  totalCount: 0,

  // 상품 상세
  currentProduct: null,
  relatedProducts: [],

  // 로딩 및 에러 상태
  loading: true,
  error: null,
  status: "idle",

  // 카테고리 목록
  categories: {},
};

/**
 * SSR 컨텍스트
 *
 * SSR에서 요청별로 격리된 스토어를 사용하기 위한 컨텍스트입니다.
 * - SSR: ssrContext.store에 요청별 스토어 설정
 * - CSR: ssrContext.store가 null이므로 싱글톤 productStore 사용
 *
 * 이를 통해 동시 요청 간 상태 오염을 방지합니다.
 */
export const ssrContext = {
  store: null,
};

/**
 * 상품 스토어 리듀서
 */
const productReducer = (state, action) => {
  switch (action.type) {
    case PRODUCT_ACTIONS.SET_STATUS:
      return {
        ...state,
        status: action.payload,
      };

    case PRODUCT_ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload.products,
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.ADD_PRODUCTS:
      return {
        ...state,
        products: [...state.products, ...action.payload.products],
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case PRODUCT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
      return {
        ...state,
        currentProduct: action.payload,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS:
      return {
        ...state,
        relatedProducts: action.payload,
        status: "done",
      };

    case PRODUCT_ACTIONS.SETUP:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

/**
 * 상품 스토어 리듀서 (SSR에서 새 스토어 생성 시 사용)
 */
export { productReducer };

/**
 * 새 상품 스토어 인스턴스 생성
 * SSR에서 요청별 격리된 스토어가 필요할 때 사용
 */
export function createProductStore() {
  return createStore(productReducer, initialProductState);
}

/**
 * 클라이언트용 싱글톤 스토어
 * CSR에서 전역적으로 사용되는 스토어
 */
export const productStore = createStore(productReducer, initialProductState);

/**
 * 현재 활성 스토어 반환
 *
 * SSR/CSR 환경에 따라 적절한 스토어를 반환합니다:
 * - SSR: ssrContext.store (요청별 격리된 스토어)
 * - CSR: productStore (싱글톤 스토어)
 */
export function getActiveStore() {
  return ssrContext.store || productStore;
}
