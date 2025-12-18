import { createStore } from "@hanghae-plus/lib";
import type { Categories, Product } from "./types";

export const PRODUCT_ACTIONS = {
  // 상품 목록
  SET_PRODUCTS: "products/setProducts",
  ADD_PRODUCTS: "products/addProducts", // 무한스크롤용
  SET_LOADING: "products/setLoading",
  SET_ERROR: "products/setError",

  // 카테고리
  SET_CATEGORIES: "products/setCategories",

  // 상품 상세
  SET_CURRENT_PRODUCT: "products/setCurrentProduct",
  SET_RELATED_PRODUCTS: "products/setRelatedProducts",

  // 리셋
  RESET_FILTERS: "products/resetFilters",
  SETUP: "products/setup",

  // status 관리
  SET_STATUS: "products/setStatus",
} as const;

/**
 * 상품 스토어 초기 상태
 */
export const initialProductState = {
  // 상품 목록
  products: [] as Product[],
  totalCount: 0,

  // 상품 상세
  currentProduct: null as Product | null,
  relatedProducts: [] as Product[],

  // 로딩 및 에러 상태
  loading: true,
  error: null as string | null,
  status: "idle",

  // 카테고리 목록
  categories: {} as Categories,
};

/**
 * 상품 스토어 리듀서
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const productReducer = (state: typeof initialProductState, action: any) => {
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
 * 상품 스토어 생성
 */
export const productStore = createStore(productReducer, initialProductState);

// ============================================
// SSR 스토어 격리
// ============================================

type ProductStore = typeof productStore;

// globalThis를 사용하여 Vite dev SSR에서 모듈 재로드 시에도 컨텍스트 유지
declare global {
  var __SSR_CONTEXT__: { store: ProductStore | null } | undefined;
}

/**
 * SSR 컨텍스트
 * - 현재 SSR 요청에서 사용할 스토어를 임시 저장
 * - 렌더링 완료 후 반드시 null로 초기화해야 함
 * - globalThis를 사용하여 Vite dev SSR에서도 동일한 컨텍스트 공유
 */
export const ssrContext: { store: ProductStore | null } =
  globalThis.__SSR_CONTEXT__ || (globalThis.__SSR_CONTEXT__ = { store: null });

/**
 * 스토어 팩토리 함수
 * - SSR에서 매 요청마다 새로운 스토어 인스턴스 생성
 */
export function createProductStore(): ProductStore {
  return createStore(productReducer, initialProductState);
}

/**
 * 활성 스토어 반환
 * - SSR 환경이면 ssrContext.store 반환
 * - CSR 환경이면 전역 productStore 반환
 */
export function getActiveStore(): ProductStore {
  return ssrContext.store || productStore;
}
