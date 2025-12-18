import { PRODUCT_ACTIONS } from "./actionTypes.js";

/**
 * 서버 사이드 렌더링용 Store 생성
 * 클라이언트의 createStore와 유사하지만 서버에서 동작하도록 단순화
 * @param {Object} initialState - 초기 상태
 * @returns {Object} - { getState, dispatch, subscribe }
 */
export function createServerStore(initialState) {
  let state = { ...initialState };

  return {
    getState: () => state,
    dispatch: (action) => {
      switch (action.type) {
        case PRODUCT_ACTIONS.SET_PRODUCTS:
          state = {
            ...state,
            products: action.payload.products,
            totalCount: action.payload.totalCount,
            loading: false,
            error: null,
          };
          break;
        case PRODUCT_ACTIONS.SET_CATEGORIES:
          state = {
            ...state,
            categories: action.payload,
          };
          break;
        case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
          state = {
            ...state,
            currentProduct: action.payload,
            loading: false,
            error: null,
          };
          break;
        case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS:
          state = {
            ...state,
            relatedProducts: action.payload,
          };
          break;
        case PRODUCT_ACTIONS.SETUP:
          state = { ...state, ...action.payload };
          break;
      }
    },
    subscribe: () => () => {}, // 서버에서는 구독 불필요
  };
}

/**
 * SSR/SSG용 기본 Store들 초기화
 * @returns {Object} - { productStore, cartStore, uiStore }
 */
export function createServerStores() {
  return {
    productStore: createServerStore({
      products: [],
      totalCount: 0,
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      error: null,
      status: "idle",
      categories: {},
    }),
    cartStore: createServerStore({
      items: [],
      selectedAll: false,
    }),
    uiStore: createServerStore({
      cartModal: { isOpen: false },
      globalLoading: false,
      toast: { isVisible: false, message: "", type: "info" },
    }),
  };
}
