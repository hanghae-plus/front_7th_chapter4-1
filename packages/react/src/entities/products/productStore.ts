import { createStore } from "@hanghae-plus/lib";
import type { Categories, Product } from "./types";

// window.__INITIAL_DATA__ 타입 선언
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: Product[];
      categories?: Categories;
      totalCount?: number;
      product?: Product;
      relatedProducts?: Product[];
    };
  }
}

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
 * Hydration: window.__INITIAL_DATA__에서 초기 상태 복원
 */
const getHydratedState = (): typeof initialProductState => {
  // 서버 환경에서는 기본 상태 반환
  if (typeof window === "undefined") {
    console.log("[Hydration] 서버 환경 - 기본 상태 반환");
    return initialProductState;
  }

  // 클라이언트에서 SSR 데이터로 초기화
  const initialData = window.__INITIAL_DATA__;
  console.log("[Hydration] window.__INITIAL_DATA__:", initialData);

  if (!initialData) {
    console.log("[Hydration] SSR 데이터 없음 - 기본 상태 반환");
    return initialProductState;
  }

  // SSR 데이터로 상태 구성
  const hydratedState = {
    ...initialProductState,
    products: initialData.products ?? [],
    categories: initialData.categories ?? {},
    totalCount: initialData.totalCount ?? 0,
    currentProduct: initialData.product ?? null,
    relatedProducts: initialData.relatedProducts ?? [],
    loading: false,
    status: "done" as const,
  };

  console.log("[Hydration] SSR 데이터로 초기화 완료:", {
    productsCount: hydratedState.products.length,
    hasCurrentProduct: !!hydratedState.currentProduct,
    status: hydratedState.status,
  });

  // 데이터 사용 후 정리 (중복 hydration 방지)
  delete window.__INITIAL_DATA__;

  return hydratedState;
};

/**
 * 상품 스토어 생성
 */
export const productStore = createStore(productReducer, getHydratedState());
