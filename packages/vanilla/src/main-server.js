import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { ServerRouter } from "./lib";
import { server } from "./mocks/server";

server.listen({
  onUnhandledRequest: "bypass",
});

export const render = async (url) => {
  // url이 빈 문자열이면 "/"로 처리 (base 경로 접근 시)
  const normalizedUrl = url || "/";

  // 각 요청마다 새로운 router 인스턴스 생성
  // SSR에서는 base 없이 순수 경로만 사용 (server.js에서 이미 base 제거됨)
  const router = new ServerRouter("");

  // 라우트 등록
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 현재 URL 설정 및 라우트 매칭
  router.setUrl(normalizedUrl);
  router.start();

  const PageComponent = router.target;

  // 페이지 로더 실행 (데이터 프리패칭)
  let pageData = null;
  if (PageComponent && PageComponent.loader) {
    pageData = (await PageComponent.loader(router)) ?? {};
  }

  const { data, title } = pageData ?? {};
  return {
    head: `<title>${title || ""}</title>`,
    html: () => PageComponent?.(data, router),
    data: data || {},
  };
};
