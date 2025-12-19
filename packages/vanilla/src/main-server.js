import { getCategories, getProduct, getProducts } from "./api/productApi";
import { HomePage, ProductDetailPage } from "./pages/index";
import { router } from "./router/router.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { productStore } from "./stores/productStore.js";
import { parseSSRQuery } from "./utils/ssrUtils.js";

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);

async function prefetchData(route, params, query) {
  if (route.path === "/product/:id/") {
    const currentProduct = await getProduct(params.id);

    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, payload: currentProduct });

    const { products } = await getProducts({
      category2: currentProduct.category2,
    });

    const relatedProducts = products.filter((product) => product.productId !== currentProduct.productId);

    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS, payload: relatedProducts });

    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_STATUS, payload: "done" });

    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: false });

    return {
      currentProduct,
      relatedProducts,
    };
  }

  if (route.path === "/") {
    const { products, pagination } = await getProducts(query);
    const { total } = pagination;
    const categories = await getCategories();

    const data = {
      products,
      categories,
      totalCount: total,
      status: "done",
    };

    productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: data });

    return data;
  }
}

export async function render(url) {
  const query = parseSSRQuery(url);
  const route = router.findRoute(url);
  router.query = query;

  const initialData = await prefetchData(route, route.params, query);

  const html = route.handler(route.params, query);
  const title = await route.handler.getTitle?.(route.params);
  const head = `<title>${title}</title>`;

  return { html, head, initialData };
}

export { getProducts };
