import type { FunctionComponent } from "react";
import { getCategories, getProduct, getProducts } from "./api/productApi";
import { App } from "./App";
import { RouterProvider, ServerRouter, type RouteMatch } from "./router";
import type { StringRecord } from "./types";
import { renderToString } from "react-dom/server";
import { InitialDataProvider, type PageData } from "./contexts/InitialDataContext";
import { initRoutes } from "./routes";

export const render = async (url: string, origin: string, baseUrl: string) => {
  try {
    const router = new ServerRouter<FunctionComponent>(baseUrl, url);
    initRoutes(router);
    router.start();

    const data = await prefetchData(router.route!, router.query, origin);
    const metaData = getMetaData(router.route!.path, data);
    const initialData = data ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(data)}</script>` : "";

    const html = renderToString(
      <InitialDataProvider value={data}>
        <RouterProvider router={router}>
          <App />
        </RouterProvider>
      </InitialDataProvider>,
    );

    return {
      head: `${metaData}${initialData}`,
      html,
    };
  } catch (error) {
    console.error("Error during render:", error);
    throw error;
  }
};

const getMetaData = (path: string, data: PageData) => {
  if (path === "/") {
    return "<title>쇼핑몰 - 홈</title>";
  } else if (path === "/product/:id/") {
    const detailData = data as { currentProduct?: { title?: string } };
    return `<title>${detailData?.currentProduct?.title ?? "상품"} - 쇼핑몰</title>`;
  }
  return "<title>쇼핑몰</title>";
};

const prefetchData = async (route: RouteMatch<FunctionComponent>, query: StringRecord, baseUrl: string) => {
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
        limit: "20", // 관련 상품 20개
        page: "1",
      },
      baseUrl,
    );
    data = { currentProduct, relatedProducts: products };
  }

  return data;
};
