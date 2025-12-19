import { getCategories, getProduct, getProducts, getRelatedProducts } from "./api/productApiServer.js";
import { HomePage } from "./pages/HomePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { router } from "./router/router.js";
import { generateTitle } from "./utils/updateTitle.js";

async function prefetchData(routeInfo, query) {
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

function generateHead(routeInfo, data) {
  const product = routeInfo?.path === "/product/:id/" ? data.currentProduct : null;
  const title = generateTitle(routeInfo, product);
  return `<title>${title}</title>`;
}

export async function render(url, query = {}) {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  const routeInfo = router.match(url, query);
  const storeData = await prefetchData(routeInfo, query);

  if (!routeInfo || storeData.error) {
    return {
      head: "<title>404 - 쇼핑몰</title>",
      html: NotFoundPage(),
      data: null,
    };
  }

  global.__SSR_DATA__ = storeData;
  global.router = router;

  const html = routeInfo.handler();

  delete global.__SSR_DATA__;
  delete global.router;

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

  return { head, html, data };
}
