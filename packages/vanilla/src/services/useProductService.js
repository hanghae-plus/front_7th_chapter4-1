import * as productApi from "../api/productApi";
import { initialProductState, PRODUCT_ACTIONS } from "../stores";
import { RouterContext, StoreContext } from "../contexts";

const useContext = () => ({
  router: RouterContext.use(),
  ...StoreContext.use(),
});

export const useProductService = () => {
  const { router, productStore } = useContext();

  const loadProductsAndCategories = async () => {
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
      ] = await Promise.all([productApi.getProducts(router.query), productApi.getCategories()]);

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
    } catch (error) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      throw error;
    }
  };

  const loadProducts = async (resetList = true) => {
    try {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: { loading: true, status: "pending", error: null },
      });

      const {
        products,
        pagination: { total },
      } = await productApi.getProducts(router.query);
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
        payload: error.message,
      });
      throw error;
    }
  };

  const loadMoreProducts = async () => {
    const state = productStore.getState();
    const hasMore = state.products.length < state.totalCount;

    if (!hasMore || state.loading) {
      return;
    }

    router.query = { current: Number(router.query.current ?? 1) + 1 };
    await loadProducts(false);
  };

  const loadProductDetailForPage = async (productId) => {
    const { productStore } = useContext();
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

      const product = await productApi.getProduct(productId);

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
        payload: error.message,
      });
      throw error;
    }
  };

  const loadRelatedProducts = async (category2, excludeProductId) => {
    try {
      const params = {
        category2,
        limit: 20, // 관련 상품 20개
        page: 1,
      };

      const response = await productApi.getProducts(params);

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

  const getCurrentProduct = () => {
    const state = productStore.getState();
    return state.currentProduct;
  };

  const getProducts = () => productStore.getState().products;

  const findProduct = (id) => getProducts().find((p) => p.productId === id);

  const isLoadable = () => {
    const productState = productStore.getState();
    const hasMore = productState.products.length < productState.totalCount;
    return !productState.loading && hasMore;
  };

  return {
    loadProductsAndCategories,
    loadProducts,
    loadMoreProducts,
    loadProductDetailForPage,
    loadRelatedProducts,
    findProduct,

    get loadable() {
      return isLoadable();
    },

    get currentProduct() {
      return getCurrentProduct();
    },
    get products() {
      return getProducts();
    },
  };
};
