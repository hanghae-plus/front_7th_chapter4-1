import { createStore } from "@hanghae-plus/lib";
import type { Categories, Product } from "./types";

/**
 * 상품 스토어 액션 타입
 * Redux 스타일의 액션 타입 정의
 */
export const PRODUCT_ACTIONS = {
  /** 상품 목록 설정 */
  SET_PRODUCTS: "products/setProducts",
  /** 상품 목록 추가 (무한 스크롤용) */
  ADD_PRODUCTS: "products/addProducts",
  /** 로딩 상태 설정 */
  SET_LOADING: "products/setLoading",
  /** 에러 상태 설정 */
  SET_ERROR: "products/setError",
  /** 카테고리 목록 설정 */
  SET_CATEGORIES: "products/setCategories",
  /** 현재 상품 설정 */
  SET_CURRENT_PRODUCT: "products/setCurrentProduct",
  /** 관련 상품 목록 설정 */
  SET_RELATED_PRODUCTS: "products/setRelatedProducts",
  /** 필터 리셋 */
  RESET_FILTERS: "products/resetFilters",
  /** 스토어 상태 일괄 설정 */
  SETUP: "products/setup",
  /** 상태 값 설정 */
  SET_STATUS: "products/setStatus",
} as const;

/**
 * 상품 스토어 상태 값 타입
 */
export type ProductStatus = "idle" | "pending" | "done";

/**
 * 액션 타입 정의
 */
type ProductAction =
  | { type: typeof PRODUCT_ACTIONS.SET_STATUS; payload: ProductStatus }
  | { type: typeof PRODUCT_ACTIONS.SET_CATEGORIES; payload: Categories }
  | { type: typeof PRODUCT_ACTIONS.SET_PRODUCTS; payload: { products: Product[]; totalCount: number } }
  | { type: typeof PRODUCT_ACTIONS.ADD_PRODUCTS; payload: { products: Product[]; totalCount: number } }
  | { type: typeof PRODUCT_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof PRODUCT_ACTIONS.SET_ERROR; payload: string }
  | { type: typeof PRODUCT_ACTIONS.SET_CURRENT_PRODUCT; payload: Product }
  | { type: typeof PRODUCT_ACTIONS.SET_RELATED_PRODUCTS; payload: Product[] }
  | { type: typeof PRODUCT_ACTIONS.SETUP; payload: Partial<ProductState> };

/**
 * 상품 스토어 초기 상태 타입
 */
export type ProductState = {
  /** 상품 목록 */
  products: Product[];
  /** 전체 상품 개수 */
  totalCount: number;
  /** 현재 선택된 상품 (상세 페이지용) */
  currentProduct: Product | null;
  /** 관련 상품 목록 */
  relatedProducts: Product[];
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 상태 값 */
  status: ProductStatus;
  /** 카테고리 목록 */
  categories: Categories;
};

/**
 * 상품 스토어 초기 상태
 */
export const initialProductState: ProductState = {
  products: [],
  totalCount: 0,
  currentProduct: null,
  relatedProducts: [],
  loading: true,
  error: null,
  status: "idle",
  categories: {},
};

/**
 * 상품 스토어 리듀서
 *
 * 액션 타입에 따라 상태를 업데이트하는 순수 함수
 *
 * @param {ProductState} state - 현재 상태
 * @param {ProductAction} action - 디스패치된 액션
 * @returns {ProductState} 새로운 상태
 */
const productReducer = (state: ProductState, action: ProductAction): ProductState => {
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
 * 기본 상품 스토어 인스턴스
 * 클라이언트 사이드에서 사용하는 전역 스토어
 */
export const productStore = createStore(productReducer, initialProductState);

/**
 * 초기 상태를 받아 새로운 상품 스토어를 생성하는 팩토리 함수
 * SSR 환경에서 각 요청마다 독립적인 스토어를 생성하기 위해 사용
 *
 * @param {Partial<ProductState>} initState - 초기 상태 (부분적으로 제공 가능)
 * @returns {ReturnType<typeof createStore>} 새로운 상품 스토어 인스턴스
 */
export const createProductStore = (initState: Partial<ProductState> = {}) => {
  return createStore(productReducer, { ...initialProductState, ...initState });
};
