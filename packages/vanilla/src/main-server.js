import { router } from "./router";
import { mockGetProducts, mockGetCategories, mockGetProduct } from "./mocks/mockApi.js";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./stores";

export { mockGetProducts } from "./mocks/mockApi.js";

export const render = async (url, query = {}) => {
  router.resolve(url);
  router.query = query;

  await prefetchData(router.route, router.params);

  try {
    const html = router.target ? router.target() : "<div>Not Found</div>";

    // head 생성
    let head = "";
    if (router.route?.path === "/") {
      head = "<title>쇼핑몰 - 홈</title>";
    } else if (router.route?.path === "/product/:id/") {
      const product = productStore.getState().currentProduct;
      head = `<title>${product?.title || "상품 상세"} - 쇼핑몰</title>`;
    } else if (router.route?.path === "/cart") {
      head = "<title>장바구니 - 쇼핑몰</title>";
    } else {
      head = "<title>쇼핑몰</title>";
    }

    const state = productStore.getState();
    return {
      html,
      head,
      initialData: {
        products: state.products,
        categories: state.categories,
        totalCount: state.totalCount,
      },
    };
  } catch (error) {
    console.error("Render error:", error.message);
    return { html: "<div>Server Error</div>", head: "<title>오류 - 쇼핑몰</title>", initialData: null };
  }
};

async function prefetchData(route, params) {
  if (route?.path === "/") {
    // Task 3: 데이터 프리페칭 구현
    // 홈 페이지: 상품 목록 + 카테고리 프리페칭
    const [{ products, pagination }, categories] = await Promise.all([
      mockGetProducts(router.query),
      mockGetCategories(),
    ]);

    // Task 4에서 초기 데이터 주입 구현
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        products,
        categories,
        totalCount: pagination.total,
        loading: false,
        status: "done",
      },
    });
  } else if (route?.path === "/product/:id/") {
    // 상품 상세 페이지: 상품 정보 프리페칭
    const product = await mockGetProduct(params.id);

    if (product) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품도 로드 (같은 category2)
      if (product.category2) {
        const { products: relatedProducts } = await mockGetProducts({
          category2: product.category2,
          limit: 20,
        });

        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: relatedProducts.filter((p) => p.productId !== params.id),
        });
      }
    }
  }
}
