import { getCategories, getProduct, getProducts } from "../../api/productApi";
import { router } from "../../router";
import type { StringRecord } from "../../types";
import { initialProductState, PRODUCT_ACTIONS, productStore } from "./productStore";
import { isNearBottom } from "../../utils";
import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { useQueryContext } from "../../contexts/QueryContext";

const createErrorMessage = (error: unknown, defaultMessage = "알 수 없는 오류 발생") =>
  error instanceof Error ? error.message : defaultMessage;

export const loadProductsAndCategories = async () => {
  router.query = { current: undefined }; // 항상 첫 페이지로 초기화
  productStore.dispatch({
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
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      },
    });
  } catch (error: unknown) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: createErrorMessage(error),
    });
    throw error;
  }
};

export const loadProducts = async (resetList = true, queryOverride?: StringRecord) => {
  try {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { loading: true, status: "pending", error: null },
    });

    // queryOverride가 있으면 사용, 없으면 router.query 사용
    const query = queryOverride || router.query;

    const {
      products,
      pagination: { total },
    } = await getProducts(query);
    const payload = { products, totalCount: total };

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    if (resetList) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SET_PRODUCTS, payload });
      return;
    }
    productStore.dispatch({ type: PRODUCT_ACTIONS.ADD_PRODUCTS, payload });
  } catch (error) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: createErrorMessage(error),
    });
    throw error;
  }
};

export const loadMoreProducts = async () => {
  const state = productStore.getState();
  const hasMore = state.products.length < state.totalCount;

  if (!hasMore || state.loading) {
    return;
  }

  // 현재 쿼리 유지하면서 페이지만 증가
  const currentQuery = router.query;
  const newQuery = { ...currentQuery, current: String(Number(currentQuery.current ?? 1) + 1) };
  const newUrl = Router.getUrl(newQuery);
  (router as Router<FunctionComponent>).push(newUrl);

  // 새 쿼리를 직접 전달
  await loadProducts(false, newQuery);
};

export const searchProducts = (search: string) => {
  const newUrl = Router.getUrl({ search, current: 1 });
  (router as Router<FunctionComponent>).push(newUrl);
};

export const setCategory = (categoryData: StringRecord) => {
  const newUrl = Router.getUrl({ ...categoryData, current: 1 });
  (router as Router<FunctionComponent>).push(newUrl);
};

export const setSort = (sort: string) => {
  const newUrl = Router.getUrl({ sort, current: 1 });
  (router as Router<FunctionComponent>).push(newUrl);
};

export const setLimit = (limit: number) => {
  const newUrl = Router.getUrl({ limit, current: 1 });
  (router as Router<FunctionComponent>).push(newUrl);
};

export const loadProductDetailForPage = async (productId: string) => {
  try {
    const currentProduct = productStore.getState().currentProduct;
    if (productId === currentProduct?.productId) {
      // 관련 상품 로드 (같은 category2 기준)
      if (currentProduct.category2) {
        await loadRelatedProducts(currentProduct.category2, productId);
      }
      return;
    }
    // 현재 상품 클리어
    productStore.dispatch({
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
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    // 관련 상품 로드 (같은 category2 기준)
    if (product.category2) {
      await loadRelatedProducts(product.category2, productId);
    }
  } catch (error) {
    console.error("상품 상세 페이지 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: createErrorMessage(error),
    });
    throw error;
  }
};

export const loadRelatedProducts = async (category2: string, excludeProductId: string) => {
  try {
    const params = {
      category2,
      limit: String(20), // 관련 상품 20개
      page: String(1),
    };

    const response = await getProducts(params);

    // 현재 상품 제외
    const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: relatedProducts,
    });
  } catch (error) {
    console.error("관련 상품 로드 실패:", error);
    // 관련 상품 로드 실패는 전체 페이지에 영향주지 않도록 조용히 처리
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: [],
    });
  }
};

export const loadNextProducts = async () => {
  // 현재 라우트가 홈이 아니면 무한 스크롤 비활성화
  if (router.route?.path !== "/") {
    return;
  }

  if (isNearBottom(200)) {
    const productState = productStore.getState();
    const hasMore = productState.products.length < productState.totalCount;

    // 로딩 중이거나 더 이상 로드할 데이터가 없으면 return
    if (productState.loading || !hasMore) {
      return;
    }

    try {
      await loadMoreProducts();
    } catch (error) {
      console.error("무한 스크롤 로드 실패:", error);
    }
  }
};

// Context 기반 검색 함수들 (Hook 형태)
export const useSearchProducts = () => {
  const { updateQuery } = useQueryContext();

  return (search: string) => {
    updateQuery({ search, current: 1 });
  };
};

export const useSetCategory = () => {
  const { updateQuery } = useQueryContext();

  return (categoryData: StringRecord) => {
    updateQuery({ ...categoryData, current: 1 });
  };
};

export const useSetSort = () => {
  const { updateQuery } = useQueryContext();

  return (sort: string) => {
    updateQuery({ sort, current: 1 });
  };
};

export const useSetLimit = () => {
  const { updateQuery } = useQueryContext();

  return (limit: number) => {
    updateQuery({ limit, current: 1 });
  };
};

export const useLoadMoreProducts = () => {
  const { query, updateQuery } = useQueryContext();

  return async () => {
    const state = productStore.getState();
    const hasMore = state.products.length < state.totalCount;

    if (!hasMore || state.loading) {
      return;
    }

    const newQuery = { ...query, current: Number(query.current ?? 1) + 1 };
    updateQuery(newQuery);
    await loadProducts(false);
  };
};
