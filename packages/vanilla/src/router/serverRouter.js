/**
 * 서버 사이드 라우터 유틸리티
 * window 객체 없이 동작하는 서버 전용 라우팅 로직
 */

/**
 * 서버 사이드에서 라우트 매칭
 * 클라이언트 Router와 동일한 로직이지만 window 객체 없이 동작
 * @param {string} url - 요청 URL
 * @param {string} baseUrl - 베이스 URL
 * @returns {Object} { path, params, handler }
 */
export function matchRoute(url, baseUrl) {
  // baseUrl 제거
  let pathname = url;
  if (baseUrl && pathname.startsWith(baseUrl)) {
    pathname = pathname.slice(baseUrl.length);
  }
  pathname = pathname.split("?")[0]; // 쿼리 제거
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  // 홈페이지: / 경로
  if (pathname === "/" || pathname === "") {
    return { path: "/", params: {}, handler: "HomePage" };
  }

  // 상품 상세 페이지: /product/:id/ 경로
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return {
      path: "/product/:id/",
      params: { id: productMatch[1] },
      handler: "ProductDetailPage",
    };
  }

  // 404: 그 외 모든 경로
  return { path: null, params: {}, handler: "NotFoundPage" };
}

/**
 * 서버 사이드에서 쿼리 파라미터 파싱
 * @param {string} search - 쿼리 문자열 (예: "?search=test&limit=20")
 * @returns {Object} 파싱된 쿼리 객체
 */
export function parseQuery(search = "") {
  const params = new URLSearchParams(search);
  const query = {};
  for (const [key, value] of params) {
    query[key] = value;
  }
  return query;
}
