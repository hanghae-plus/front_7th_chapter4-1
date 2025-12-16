import { getCategories, getProduct, getProducts } from "./api/productApi";
import { ROUTES } from "./constants";
import { ServerRouter } from "./lib/ServerRouter";
import { server } from "./mocks/node";

const prod = process.env.NODE_ENV === "production";
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

export const render = async (url, origin) => {
  console.log({ url, origin });

  // 1. MSW 서버 설정
  server.listen();

  try {
    const router = setServerRouter(url);
    const data = await prefetchData(router.route, router.query, origin);
    console.log({ data });
    return "";
  } catch (error) {
    console.error("Error during prefetch:", error);
    return "";
  } finally {
    // 2. 정리
    server.close();
  }
};

const setServerRouter = (url) => {
  const router = new ServerRouter(base, url);
  ROUTES.forEach(({ path, target }) => router.addRoute(path, target));
  router.start();
  return router;
};

const prefetchData = async (route, query, baseUrl) => {
  const { path, params } = route;
  console.log({ path, params, query });

  let data;
  if (path === "/") {
    const [products, categories] = await Promise.all([getProducts(query, baseUrl), getCategories(baseUrl)]);
    data = { products, categories };
  } else if (path === "/product/:id") {
    const products = await getProduct(params.id, baseUrl);
    data = { products };
  }

  return data;
};
