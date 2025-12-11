import { App } from "./App";
import { createRouter, initRoutes } from "./router";
import { createStores, setupProductState } from "./entities";
import { NotFoundPage } from "./pages";
import { Providers } from "./apps";
import { renderToString } from "react-dom/server";

export const render = async (url: string) => {
  // URL 보정: 빈 문자열인 경우 "/", "/"로 시작하지 않으면 "/" 추가
  const router = createRouter();
  const stores = createStores();
  initRoutes(router);
  router.push(url);
  router.query = { current: undefined };
  const PageComponent = router.target ?? NotFoundPage;
  const { head, ...initialData } = await PageComponent.getServerProps(router);

  setupProductState(stores.productStore, initialData);

  const html = renderToString(
    <Providers {...stores} router={router}>
      <App />
    </Providers>,
  );

  try {
    return {
      html,
      head,
      initialData,
    };
  } catch (error) {
    const err = error as Error;
    console.error("SSR 렌더링 오류:", error);
    console.error("Error stack:", err.stack);
    console.error("Error message:", err.message);

    // 오류 발생 시 기본 HTML 반환
    return {
      html: `<div>페이지를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`,
      head: `<title>React Shopping App</title>`,
      initialData: {},
    };
  }
};
