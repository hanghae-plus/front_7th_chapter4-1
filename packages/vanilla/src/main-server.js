/**
 * 서버 사이드에서 라우트 매칭
 * 클라이언트 Router와 동일한 로직이지만 window 객체 없이 동작
 */
function matchRoute(url, baseUrl) {
  // baseUrl 제거
  let pathname = url;
  if (baseUrl && pathname.startsWith(baseUrl)) {
    pathname = pathname.slice(baseUrl.length);
  }
  pathname = pathname.split("?")[0]; // 쿼리 제거
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  // 홈페이지
  if (pathname === "/" || pathname === "") {
    return { path: "/", params: {}, handler: "HomePage" };
  }

  // 상품 상세 페이지: /product/:id/
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return {
      path: "/product/:id/",
      params: { id: productMatch[1] },
      handler: "ProductDetailPage",
    };
  }

  // 404
  return { path: null, params: {}, handler: "NotFoundPage" };
}

/**
 * 서버 사이드 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 쿼리 파라미터 객체 (다음 단계에서 사용 예정)
 * @returns {Promise<{html: string, initialState: Object}>}
 */
export const render = async (url, query = {}) => {
  try {
    // baseUrl 설정 (프로덕션/개발 환경에 따라)
    const baseUrl = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/vanilla/" : "/";

    // 라우트 매칭
    const route = matchRoute(url, baseUrl);

    // 임시로 빈 HTML 반환 (다음 단계에서 실제 렌더링 구현)
    // query는 다음 단계에서 사용 예정
    void query; // ESLint 경고 방지 (다음 단계에서 사용)
    return {
      html: `<div>라우트 매칭 완료: ${route.path || "404"}, 파라미터: ${JSON.stringify(route.params)}</div>`,
      initialState: {},
    };
  } catch (error) {
    console.error("서버 렌더링 오류:", error);
    return {
      html: '<div class="p-4 text-red-600">서버 렌더링 중 오류가 발생했습니다.</div>',
      initialState: {},
    };
  }
};
