import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { serverRouter } from "./router/ServerRouter";
import { setSSRContext, type SSRData } from "./router/ssrContext";
import { loadHomePageData, loadProductDetailData } from "./ssr/ssr-data";
import { ToastProvider, ModalProvider } from "./components";
import type { FunctionComponent } from "react";

interface RenderResult {
  html: string;
  head: string;
  initialData: SSRData | null;
}

/**
 * URL에서 쿼리스트링 파싱
 */
function parseQueryFromUrl(url: string): Record<string, string> {
  const queryString = url.split("?")[1] || "";
  const params = new URLSearchParams(queryString);
  const query: Record<string, string> = {};

  params.forEach((value, key) => {
    query[key] = value;
  });

  return query;
}

/**
 * 페이지별 데이터 프리페칭
 */
async function prefetchData(
  pathname: string,
  params: Record<string, string>,
  query: Record<string, string>,
): Promise<{ data: SSRData; head: string }> {
  // 홈페이지
  if (pathname === "/" || pathname === "") {
    const homeData = await loadHomePageData(query);
    return {
      data: {
        products: homeData.products,
        categories: homeData.categories,
        totalCount: homeData.totalCount,
      },
      head: `<title>쇼핑몰 - 홈</title>
<meta name="description" content="다양한 상품을 만나보세요" />`,
    };
  }

  // 상품 상세 페이지
  if (params.id) {
    const detailData = await loadProductDetailData(params.id);
    return {
      data: {
        product: detailData.product,
        relatedProducts: detailData.relatedProducts,
      },
      head: `<title>${detailData.product.title} - 쇼핑몰</title>
<meta name="description" content="${detailData.product.title} - ${detailData.product.brand}" />`,
    };
  }

  // 기본값
  return {
    data: {},
    head: `<title>쇼핑몰</title>`,
  };
}

/**
 * SSR 렌더링 함수
 * @param url - 요청 URL
 * @returns 렌더링된 HTML, head, 초기 데이터
 */
export const render = async (url: string): Promise<RenderResult> => {
  // 1. URL 파싱
  const pathname = url.split("?")[0];
  const query = parseQueryFromUrl(url);

  // 2. 라우트 매칭
  const route = serverRouter.findRoute(pathname);
  const PageComponent: FunctionComponent = route?.component ?? serverRouter.getNotFoundComponent();
  const params = route?.params ?? {};

  // 3. 데이터 프리페칭
  const { data: initialData, head } = await prefetchData(pathname, params, query);

  // 4. SSR Context 설정
  setSSRContext({
    url,
    query,
    params,
    data: initialData,
  });

  try {
    // 5. React 컴포넌트 → HTML 문자열
    const html = renderToString(
      createElement(ToastProvider, null, createElement(ModalProvider, null, createElement(PageComponent))),
    );

    return { html, head, initialData };
  } finally {
    // 6. SSR Context 클리어 (메모리 누수 방지)
    setSSRContext(null);
  }
};
