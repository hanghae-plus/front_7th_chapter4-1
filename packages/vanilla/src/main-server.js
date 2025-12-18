import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { PRODUCT_ACTIONS, productStore } from "./stores";

export const render = async (url, query) => {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
  router.start();
  router.push(url);
  router.query = query;

  const PageComponent = router.target;
  const initData = await PageComponent.getServerSideProps?.();

  if (PageComponent === HomePage) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initData.products,
        categories: initData.categories,
        totalCount: initData.pagination.total,
        loading: false,
        status: "done",
      },
    });
  }

  return {
    head: `<title>${PageComponent.title || "쇼핑몰"}</title>`,
    html: PageComponent(),
    data: initData,
  };
};
