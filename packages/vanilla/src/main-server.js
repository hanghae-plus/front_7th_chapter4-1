import { createRequestContextBase } from "./ssr/context.js";
import { ServerRouter } from "./lib/ServerRouter.js";
import { routes } from "./router/router.js";
import { normalizePathname } from "./server/utils/ssrUtils.js";

/**
 * SSR 렌더링 함수
 * 서버에서 페이지를 렌더링하고 HTML 문자열과 초기 데이터를 반환함
 *
 * @param {string} pathname - 요청된 경로
 * @param {Object} query - 쿼리 파라미터 객체
 * @returns {Promise<Object>} 렌더링 결과 { html, head, __INITIAL_DATA__, state, meta }
 */
export const render = async (pathname, query) => {
  // pathname 정규화 (빈 경로 처리, 상품 상세 페이지 슬래시 추가)
  const normalizedPathname = normalizePathname(pathname);

  // 서버 라우터 생성 및 초기화
  const router = new ServerRouter(routes, createRequestContextBase);
  router.query = query; // 쿼리 파라미터 설정
  router.start(normalizedPathname); // 라우트 매칭

  const params = { pathname: normalizedPathname, query, params: router.params };

  // SSR 함수가 있는 경우 (예: HomePage, ProductDetailPage)
  if (router.target?.ssr) {
    // 서버에서 데이터 페칭 및 렌더링
    const result = await router.target(params);

    return {
      html: result.html, // 렌더링된 HTML 문자열
      __INITIAL_DATA__: result.data ?? {}, // 클라이언트 하이드레이션용 초기 데이터
      head: result.metadata?.title ? `<title>${result.metadata.title}</title>` : "", // 페이지 메타데이터
      state: result.data ?? {}, // 상태 데이터 (호환성)
      meta: result.metadata ?? null, // 메타데이터 객체
    };
  }

  // SSR 함수가 없는 경우 (예: NotFoundPage)
  const metadata = await router.target?.metadata?.(params);
  const html = router.target ? router.target({ ...params, data: {} }) : "";
  return {
    html,
    __INITIAL_DATA__: {}, // SSR 데이터가 없으니 빈 객체
    head: metadata?.title ? `<title>${metadata.title}</title>` : "",
    state: {},
    meta: metadata ?? null,
  };
};
