import { renderToString } from "react-dom/server";
import { App } from "./App";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import {
  loadHomePageData,
  loadProductDetailData,
  generateMetaData,
  metaToHead,
  type HomePageData,
  type ProductDetailData,
} from "./ssr-helpers";

// Server-side Router를 위한 모듈
// 서버 환경에서는 MemoryRouter 역할을 해야 함
import { router } from "./router";

export const render = async (url: string, query: Record<string, string>) => {
  // URL 파싱
  const pathname = url.split("?")[0];

  let initialData: HomePageData | ProductDetailData | null = null;
  let metaData = generateMetaData(url); // 기본 메타데이터 초기화

  // 라우트별 데이터 프리로딩
  if (pathname === "/" || pathname === "") {
    // 홈페이지
    initialData = await loadHomePageData(query);
    metaData = generateMetaData(url, initialData);

    // 스토어 초기화
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products,
        categories: initialData.categories,
        totalCount: initialData.totalCount,
        loading: false,
        error: null,
        status: "done",
      },
    });
  } else if (pathname.match(/^\/product\/([^/]+)\/?$/)) {
    // 상품 상세 페이지
    const match = pathname.match(/^\/product\/([^/]+)\/?$/);
    const productId = match?.[1];

    if (productId) {
      initialData = await loadProductDetailData(productId);

      if (initialData) {
        metaData = generateMetaData(url, initialData);

        // 스토어 초기화
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            currentProduct: initialData.product,
            relatedProducts: initialData.relatedProducts,
            loading: false,
            error: null,
            status: "done",
          },
        });
      } else {
        metaData = generateMetaData(url);
      }
    }
  } else {
    // 404
    metaData = generateMetaData(url);
  }

  // 서버 라우터 설정
  if ("setServerPath" in router && typeof router.setServerPath === "function") {
    router.setServerPath(pathname, query);
  }

  // React 컴포넌트를 HTML 문자열로 변환
  const html = renderToString(<App />);

  // 메타데이터를 head 문자열로 변환
  const head = metaToHead(metaData);

  return {
    html,
    head,
    initialData,
  };
};
