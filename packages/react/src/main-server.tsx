import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "./constants";
import { routes } from "./router";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { createProductStore } from "./entities";
import { ProductProvider } from "./entities/products/context/ProductContext";
import { RouterProvider } from "./router/RouterContext";

type SSRParams = {
  pathname: string;
  query: Record<string, string>;
  params: Record<string, string>;
};

type SSRComponent = {
  ssr?: (params: SSRParams) => Promise<unknown>;
  metadata?: (params: SSRParams) => Promise<{ title?: string }>;
  (params: SSRParams & { data: Record<string, unknown> }): string;
};

/**
 * SSR 렌더링 함수
 * 서버에서 React 컴포넌트를 HTML 문자열로 변환하고, 초기 데이터를 포함해서 반환함
 *
 * @param {string} pathname - 요청된 경로
 * @param {Object} query - 쿼리 파라미터 객체
 * @returns {Promise<Object>} 렌더링 결과 { html, head, __INITIAL_DATA__ }
 */
export const render = async (pathname: string, query: Record<string, string>) => {
  const router = new Router(routes, BASE_URL);
  router.start(pathname);
  router.query = query;
  const params = { pathname, query, params: router.params };

  const target = router.target as unknown as SSRComponent;

  // SSR 함수가 있는 경우 (예: HomePage, ProductDetailPage)
  if (target?.ssr) {
    // 서버에서 데이터 페칭
    const result = await target.ssr(params);
    const metadata = await target.metadata?.(params);

    let htmlString: string;
    try {
      // React 컴포넌트를 HTML 문자열로 변환
      htmlString = renderToString(
        <RouterProvider router={router}>
          <ProductProvider productStore={createProductStore(result || {})}>
            <App />
          </ProductProvider>
        </RouterProvider>,
      );
    } catch (error) {
      console.error("Error in renderToString:", error);
      throw error;
    }

    return {
      head: `<title>${metadata?.title || ""}</title>`,
      html: htmlString,
      __INITIAL_DATA__: result, // 클라이언트에서 하이드레이션할 때 사용할 데이터
    };
  }

  // SSR 함수가 없는 경우 (예: NotFoundPage)
  const metadata = target && typeof target.metadata === "function" ? await target.metadata(params) : null;
  let htmlString = "";
  if (target) {
    try {
      // SSR 데이터 없이 렌더링 (빈 스토어로 초기화)
      htmlString = renderToString(
        <RouterProvider router={router}>
          <ProductProvider productStore={createProductStore({})}>
            <App />
          </ProductProvider>
        </RouterProvider>,
      );
    } catch (error) {
      console.error("Error in renderToString (no SSR):", error);
      throw error;
    }
  }
  return {
    head: `<title>${metadata?.title || ""}</title>`,
    html: htmlString,
    __INITIAL_DATA__: {}, // SSR 데이터가 없으니 빈 객체
  };
};
