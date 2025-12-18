import { router } from "./router/router.js";
import { mockGetProducts, mockGetCategories, mockGetProduct } from "./mocks/mockApi.js";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./stores";

export const render = async (url, query) => {
  router.resolve(url);

  console.log("Query:", query);
  console.log("URL:", url);
  console.log("Route:", router.route);
  console.log("Params:", router.params);
  console.log("Target:", router.target);

  // Task 3: 데이터 프리페칭 구현
  await prefetchData(router.route, router.params);
  // TODO: Task 4에서 초기 데이터 주입 구현

  try {
    const html = router.target ? router.target() : "<div>Not Found</div>";
    return { html, head: "" };
  } catch (error) {
    console.error("Render error:", error.message);
    return { html: "<div>Server Error</div>", head: "" };
  }
};

async function prefetchData(route, params) {
  if (route?.path === "/") {
    // 홈 페이지: 상품 목록 + 카테고리 프리페칭
    const [{ products, pagination }, categories] = await Promise.all([mockGetProducts(), mockGetCategories()]);

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
