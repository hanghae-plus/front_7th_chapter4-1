import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { server } from "./mocks/server";
import { getProducts, getCategories, getProduct } from "./api/productApi";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities/products/productStore";

// MSW 서버 시작
server.listen({ onUnhandledRequest: "bypass" });

interface RenderResult {
  html: string;
  head: string;
}

export const render = async (url: string, query: Record<string, string>): Promise<RenderResult> => {
  // SSR용 URL 설정
  router.setServerUrl(url, query);

  // store 초기화
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: { ...initialProductState },
  });

  let title = "쇼핑몰 - 홈";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialData: any = {};

  const route = router.route;

  // 라우트별 데이터 패칭
  if (route?.path === "/") {
    // 홈페이지: 상품 목록 + 카테고리
    try {
      const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsResponse.products,
          categories,
          totalCount: productsResponse.pagination.total,
          loading: false,
          status: "done",
        },
      });

      initialData = {
        products: productsResponse.products,
        categories,
        totalCount: productsResponse.pagination.total,
      };
    } catch (error) {
      console.error("SSR 데이터 패칭 실패:", error);
    }
  } else if (route?.path === "/product/:id/") {
    // 상품 상세 페이지
    const productId = router.params.id;
    try {
      const product = await getProduct(productId);

      // 관련 상품 로드
      let relatedProducts: typeof initialData.relatedProducts = [];
      if (product.category2) {
        const relatedResponse = await getProducts({
          category2: product.category2,
          limit: "20",
        });
        relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
      }

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          currentProduct: product,
          relatedProducts,
          loading: false,
          status: "done",
        },
      });

      title = `${product.title} - 쇼핑몰`;
      initialData = {
        currentProduct: product,
        relatedProducts,
      };
    } catch (error) {
      console.error("SSR 상품 상세 데이터 패칭 실패:", error);
    }
  }

  // Re-set the server URL right before render to prevent race conditions
  // (another request may have changed router state during async data fetching)
  router.setServerUrl(url, query);

  const html = renderToString(<App />);

  // 클라이언트 hydration용 초기 데이터
  const head = `
    <title>${title}</title>
    <script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>
  `;

  return { html, head };
};
