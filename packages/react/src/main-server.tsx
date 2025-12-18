import { homeLoader, productDetailLoader } from "./loaders";
import { renderHomePage, renderProductDetailPage } from "./renderers";
import type { StringRecord } from "./types";

/**
 * 간단한 라우트 매처
 */
function matchRoute(pathname: string): { route: string; params: StringRecord } | null {
  // 홈페이지: /
  if (pathname === "/" || pathname === "") {
    return { route: "/", params: {} };
  }

  // 상품 상세: /products/:id/
  const productMatch = pathname.match(/^\/products\/([^/]+)\/?$/);
  if (productMatch) {
    return {
      route: "/products/:id/",
      params: { id: productMatch[1] },
    };
  }

  return null;
}

/**
 * 404 페이지 렌더링
 */
function render404() {
  return {
    head: `<title>404 | 쇼핑몰</title>`,
    html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-gray-600 mb-4">페이지를 찾을 수 없습니다.</p>
        <a href="/" data-link class="text-blue-600 hover:underline">홈으로 돌아가기</a>
      </div>
    </div>`,
    __INITIAL_DATA__: {},
  };
}

/**
 * SSR 렌더링 함수
 */
export const render = async (url: string, query: StringRecord = {}) => {
  // URL에서 pathname 추출
  let pathname: string;
  try {
    const urlObj = new URL(url, "http://localhost");
    pathname = urlObj.pathname;
  } catch {
    pathname = url.split("?")[0];
  }

  // 라우트 매칭
  const match = matchRoute(pathname);

  console.log("SSR Match:", { url, pathname, match, query });

  // 404 처리
  if (!match) {
    return render404();
  }

  try {
    // 홈페이지
    if (match.route === "/") {
      console.log("Loading home page data...");
      const data = await homeLoader(query);
      console.log("Rendering home page...");
      const { head, html } = renderHomePage(data);
      return {
        head,
        html,
        __INITIAL_DATA__: data,
      };
    }

    // 상품 상세 페이지
    if (match.route === "/products/:id/") {
      console.log(`Loading product detail data for ${match.params.id}...`);
      const data = await productDetailLoader(query, match.params);
      console.log("Rendering product detail page...");
      const { head, html } = renderProductDetailPage(data);
      return {
        head,
        html,
        __INITIAL_DATA__: data,
      };
    }

    // 알 수 없는 라우트
    return render404();
  } catch (error) {
    console.error(`Error rendering ${match.route}:`, error);

    // 에러 페이지 반환
    return {
      head: `<title>오류 발생 | 쇼핑몰</title>`,
      html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">오류 발생</h1>
          <p class="text-gray-600 mb-4">${error instanceof Error ? error.message : "알 수 없는 오류"}</p>
          <a href="/" data-link class="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </div>
      </div>`,
      __INITIAL_DATA__: {},
    };
  }
};
