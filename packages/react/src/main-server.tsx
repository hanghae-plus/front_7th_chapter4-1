import type { MemoryRouterInstance } from "@hanghae-plus/lib";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { createRouter } from "./router/router";
import type { FunctionComponent } from "react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { server } from "./mocks/server";

server.listen({
  onUnhandledRequest: "bypass",
});

export const render = async (url: string) => {
  const normalizedUrl = url || "/";

  // render가 호출될 때마다 새로운 Router 인스턴스 생성
  const router = createRouter() as MemoryRouterInstance<FunctionComponent>;

  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 현재 URL 설정 및 라우트 매칭
  router.setUrl(normalizedUrl);
  router.start();

  const PageComponent = router.target;
  console.log(PageComponent, "PageComponent", normalizedUrl);

  // 페이지 로더 실행 (데이터 프리패칭)
  let pageData = null;
  if (PageComponent && PageComponent.loader) {
    pageData = (await PageComponent.loader(router)) ?? {};
  }

  const { data, title } = pageData ?? { data: {}, title: "" };
  return {
    head: `<title>${title || ""}</title>`,
    html: renderToString(createElement(() => PageComponent?.({ serversideProps: data, serverRouter: router }))),
    initialDataScript: data ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(data)}</script>` : "",
  };
};
