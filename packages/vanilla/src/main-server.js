import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";

export const render = async (url, query) => {
  console.log({ url, query });

  // 1. Store 초기화
  // 2. 라우트 매칭
  const { page, title, description } = serverRouter(url);
  // 3. 데이터 프리페칭
  // 4. HTML 생성

  return {
    // html: "<div>안녕하세요</div>",
    html: page(),
    head: `<title>${title}</title><meta name="description" content="${description}">`,
    initialDataScript: "<script>console.log('initialData')</script>",
  };
};

const serverRouter = (url) => {
  const route = pageRegistry.get(url);
  if (route) {
    return route;
  }
  return NotFoundPage;
};

const pageRegistry = new Map();
pageRegistry.set("/", {
  page: HomePage,
  title: "Home",
  description: "Home page",
});
pageRegistry.set("/product/:id/", {
  page: ProductDetailPage,
  title: "Product Detail",
  description: "Product detail page",
});
pageRegistry.set(".*", {
  page: NotFoundPage,
  title: "Not Found",
  description: "Not found page",
});
