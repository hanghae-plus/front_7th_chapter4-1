import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { renderToString } from "react-dom/server";
import { getCategories, getProduct, getProducts, getRelatedProducts } from "./api/productApiServer";
import { initialProductState, PRODUCT_ACTIONS, productStore } from "./entities/products/productStore";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { RouterContext } from "./router/RouterContext";
import { generateTitle } from "./utils/updateTitle";

async function prefetchData(
  routeInfo: ReturnType<InstanceType<typeof Router<FunctionComponent>>["match"]> | null,
  query: Record<string, string>,
) {
  if (!routeInfo) return {};
  const { path, params } = routeInfo;

  if (path === "/") {
    const [productsData, categories] = await Promise.all([
      getProducts({
        limit: parseInt(query.limit) || 20,
        search: query.search || "",
        category1: query.category1 || "",
        category2: query.category2 || "",
        sort: query.sort || "price_asc",
        page: 1,
      }),
      getCategories(),
    ]);

    return {
      products: productsData.products,
      totalCount: productsData.pagination.total,
      categories,
      loading: false,
      error: null,
      status: "done",
    };
  } else if (path === "/product/:id/") {
    const product = await getProduct(params.id);

    if (!product) return { error: "Product not found" };

    const relatedProducts = await getRelatedProducts(product.category1, product.category2, product.productId, 20);

    return {
      currentProduct: product,
      relatedProducts,
      loading: false,
      error: null,
      status: "done",
    };
  }

  return {};
}

export type RouteInfoType = ReturnType<InstanceType<typeof Router<FunctionComponent>>["match"]>;
export type PrefetchDataType = Awaited<ReturnType<typeof prefetchData>>;

function generateHead(routeInfo: RouteInfoType, data: PrefetchDataType) {
  const product = routeInfo?.path === "/product/:id/" ? (data.currentProduct ?? null) : null;
  const title = generateTitle(routeInfo, product);
  return `<title>${title}</title>`;
}

export async function render(url: string, query: Record<string, string> = {}) {
  const router = new Router<FunctionComponent>("");
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  const routeInfo = router.match(url, query);
  const storeData = await prefetchData(routeInfo, query);

  if (!routeInfo || storeData.error) {
    return {
      head: "<title>404 - 쇼핑몰</title>",
      html: renderToString(<NotFoundPage />),
      data: null,
    };
  }

  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: { ...initialProductState, ...storeData } });

  const PageComponent = routeInfo.handler;
  const html = renderToString(
    <RouterContext.Provider value={router}>
      <PageComponent />
    </RouterContext.Provider>,
  );

  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: { ...initialProductState } });

  const head = generateHead(routeInfo, storeData);

  let initialData;

  if (routeInfo.path === "/") {
    initialData = {
      products: storeData.products,
      categories: storeData.categories,
      totalCount: storeData.totalCount,
    };
  } else if (routeInfo.path === "/product/:id/") {
    initialData = {
      currentProduct: storeData.currentProduct,
      relatedProducts: storeData.relatedProducts,
    };
  } else {
    initialData = storeData;
  }

  const data = initialData ? `<script>window.__INITIAL_DATA__=${JSON.stringify(initialData)};</script>` : null;

  return { html, head, data };
}
