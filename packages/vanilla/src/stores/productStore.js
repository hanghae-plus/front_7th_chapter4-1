import { createStore } from "../lib";
import { PRODUCT_ACTIONS } from "./actionTypes";
import { isServer } from "../router/ssrContext.js";

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
 * SSR Hydration: window.__INITIAL_DATA__에서 초기 상태 복원
 */
const getHydratedState = () => {
  // 서버 환경에서는 기본 상태 반환
  if (isServer()) {
    return initialProductState;
  }

  const initialData = window.__INITIAL_DATA__;

  // SSR 데이터가 없으면 기본 상태 반환 (CSR 모드)
  if (!initialData) {
    return initialProductState;
  }

  // SSR 데이터로 초기 상태 구성
  const hydratedState = { ...initialProductState };

  // 홈페이지 데이터 (상품 목록 + 카테고리)
  if (initialData.products) {
    hydratedState.products = initialData.products;
    hydratedState.totalCount = initialData.totalCount ?? 0;
    hydratedState.loading = false;
    hydratedState.status = "done";
  }

  if (initialData.categories) {
    hydratedState.categories = initialData.categories;
  }

  // 상품 상세 페이지 데이터
  if (initialData.product) {
    hydratedState.currentProduct = initialData.product;
    hydratedState.loading = false;
    hydratedState.status = "done";
  }

  // 관련 상품 데이터
  if (initialData.relatedProducts) {
    hydratedState.relatedProducts = initialData.relatedProducts;
  }

  // 사용 완료 후 정리 (메모리 절약 + 중복 hydration 방지)
  delete window.__INITIAL_DATA__;

  console.log("[Hydration] SSR 데이터로 초기화 완료", hydratedState);

  return hydratedState;
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
 * 상품 스토어 생성 (SSR Hydration 적용)
 */
export const productStore = createStore(productReducer, getHydratedState());
