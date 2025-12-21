import { CoreRouter } from "./lib/router/CoreRouter";
import { createServerRuntime } from "./lib/router/server-adapter";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";

export const render = async (url) => {
  const runtime = createServerRuntime(url);
  const router = new CoreRouter(runtime, "/app");

  router.addRoute("/", HomePage, { title: "Home", description: "Home page" });
  router.addRoute("/product/:id/", ProductDetailPage, { title: "Product Detail", description: "Product detail page" });
  router.addRoute(".*", NotFoundPage, { title: "Not Found", description: "Not found page" });

  router.start();

  const html = router.target ? await router.target() : "<div>Not Found</div>";
  const title = router.route?.meta?.title ?? "Not Found";
  const description = router.route?.meta?.description ?? "Not Found";

  // 1. Store 초기화
  // 2. 라우트 매칭
  // 3. 데이터 프리페칭
  // const html = page();
  // 4. HTML 생성

  return {
    html,
    head: `<title>${title}</title><meta name="description" content="${description}">`,
    initialDataScript: "<script>console.log('initialData')</script>",
  };
};

// // 서버 라우터
// const serverRouter = (url) => {
//   const route = pageRegistry.get(url);
//   if (route) {
//     return route;
//   }
//   return NotFoundPage;
// };

// // 페이지 레지스트리
// const pageRegistry = new Map();
// pageRegistry.set("/", {
//   page: HomePage,
//   title: "Home",
//   description: "Home page",
// });
// pageRegistry.set("/product/:id/", {
//   page: ProductDetailPage,
//   title: "Product Detail",
//   description: "Product detail page",
// });
// pageRegistry.set(".*", {
//   page: NotFoundPage,
//   title: "Not Found",
//   description: "Not found page",
// });
