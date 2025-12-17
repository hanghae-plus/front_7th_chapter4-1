import { getCategories, getProduct, getProducts } from "./api/productApi";
import { server } from "./mocks/node";
import { ServerRouter } from "./lib";
import { BASE_URL } from "./constants";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";

export const render = async (url, origin) => {
  console.log({ url, origin });

  // 1. MSW 서버 설정
  server.listen();

  try {
    const router = new ServerRouter(BASE_URL, url);
    router.addRoute("/", HomePage);
    router.addRoute("/product/:id/", ProductDetailPage);
    router.addRoute(".*", NotFoundPage);
    router.start();

    const data = await prefetchData(router.route, router.query, origin);
    const metaData = getMetaData(router.route.path, data);
    const initialData = data ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(data)}</script>` : "";
    const pageComponent = router.target;

    return {
      head: `${metaData} ${initialData}`,
      html: () => pageComponent({ ...data, loading: false, error: null, serverRouter: router }),
    };
  } catch (error) {
    console.error("Error during prefetch:", error);
  } finally {
    // 2. 정리
    server.close();
  }
};

const getMetaData = (path, data) => {
  if (path === "/") return "<title>쇼핑몰 - 홈</title>";
  else if (path === "/product/:id/") return `<title>${data.currentProduct.title} - 쇼핑몰</title>`;
};

const prefetchData = async (route, query, baseUrl) => {
  const { path, params } = route;

  let data;
  if (path === "/") {
    const [{ products, pagination }, categories] = await Promise.all([
      getProducts(query, baseUrl),
      getCategories(baseUrl),
    ]);
    data = { products, categories, totalCount: pagination.total };
  } else if (path === "/product/:id/") {
    const currentProduct = await getProduct(params.id, baseUrl);
    const { products } = await getProducts(
      {
        category2: currentProduct.category2,
        limit: 20, // 관련 상품 20개
        page: 1,
      },
      baseUrl,
    );
    data = { currentProduct, relatedProducts: products };
  }

  return data;
};
