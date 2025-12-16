import { getCategories, getProduct, getProducts } from "../api/productApi";
import { initialProductState, getActiveStore, PRODUCT_ACTIONS } from "../stores";
import { router } from "../router";

export const loadProductsAndCategories = async () => {
  // TODO: SSR Hydration 대응 - 이미 데이터가 있으면 API 호출 스킵
  // 참고: https://junilhwang.github.io/TIL/Javascript/Design/Vanilla-JS-Server-Side-Rendering/
  // 패턴: 초기 로드 시 서버 데이터 사용, API는 사용자 상호작용 시에만 호출
  //
  // 1. getActiveStore().getState()로 현재 상태 가져오기
  // 2. products 배열에 데이터가 있으면 early return
  const { products } = getActiveStore().getState();
  if (products.length > 0) return;

  router.query = { current: undefined }; // 항상 첫 페이지로 초기화
  getActiveStore().dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: true,
      status: "pending",
    },
  });

  try {
    const [
      {
        products,
        pagination: { total },
      },
      categories,
    ] = await Promise.all([getProducts(router.query), getCategories()]);

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      },
    });
  } catch (error) {
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * 상품 목록 로드 (새로고침)
 */
export const loadProducts = async (resetList = true) => {
  try {
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { loading: true, status: "pending", error: null },
    });

    const {
      products,
      pagination: { total },
    } = await getProducts(router.query);
    const payload = { products, totalCount: total };

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    if (resetList) {
      getActiveStore().dispatch({ type: PRODUCT_ACTIONS.SET_PRODUCTS, payload });
      return;
    }
    getActiveStore().dispatch({ type: PRODUCT_ACTIONS.ADD_PRODUCTS, payload });
  } catch (error) {
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * 다음 페이지 로드 (무한 스크롤)
 */
export const loadMoreProducts = async () => {
  const state = getActiveStore().getState();
  const hasMore = state.products.length < state.totalCount;

  if (!hasMore || state.loading) {
    return;
  }

  router.query = { current: Number(router.query.current ?? 1) + 1 };
  await loadProducts(false);
};
/**
 * 상품 검색
 */
export const searchProducts = (search) => {
  router.query = { search, current: 1 };
};

/**
 * 카테고리 필터 설정
 */
export const setCategory = (categoryData) => {
  router.query = { ...categoryData, current: 1 };
};

/**
 * 정렬 옵션 변경
 */
export const setSort = (sort) => {
  router.query = { sort, current: 1 };
};

/**
 * 페이지당 상품 수 변경
 */
export const setLimit = (limit) => {
  router.query = { limit, current: 1 };
};

/**
 * 상품 상세 페이지용 상품 조회 및 관련 상품 로드
 */
export const loadProductDetailForPage = async (productId) => {
  // TODO: SSR Hydration 대응 - 이미 해당 상품 데이터가 있으면 API 호출 스킵
  // 현재 로직: productId가 같으면 관련 상품만 로드
  // SSR 대응: 이미 currentProduct가 있고 productId가 같으면 완전히 스킵
  //
  // 힌트: 기존 체크 로직을 활용하되, relatedProducts도 이미 있으면 스킵하도록 수정
  const { currentProduct, relatedProducts } = getActiveStore().getState();
  if (currentProduct?.productId === productId && relatedProducts.length > 0) return;

  try {
    const currentProduct = getActiveStore().getState().currentProduct;
    if (productId === currentProduct?.productId) {
      // 관련 상품 로드 (같은 category2 기준)
      if (currentProduct.category2) {
        await loadRelatedProducts(currentProduct.category2, productId);
      }
      return;
    }
    // 현재 상품 클리어
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        currentProduct: null,
        loading: true,
        status: "pending",
      },
    });

    const product = await getProduct(productId);

    // 현재 상품 설정
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    // 관련 상품 로드 (같은 category2 기준)
    if (product.category2) {
      await loadRelatedProducts(product.category2, productId);
    }
  } catch (error) {
    console.error("상품 상세 페이지 로드 실패:", error);
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * 관련 상품 로드 (같은 카테고리의 다른 상품들)
 */
export const loadRelatedProducts = async (category2, excludeProductId) => {
  try {
    const params = {
      category2,
      limit: 20, // 관련 상품 20개
      page: 1,
    };

    const response = await getProducts(params);

    // 현재 상품 제외
    const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);

    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: relatedProducts,
    });
  } catch (error) {
    console.error("관련 상품 로드 실패:", error);
    // 관련 상품 로드 실패는 전체 페이지에 영향주지 않도록 조용히 처리
    getActiveStore().dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: [],
    });
  }
};
