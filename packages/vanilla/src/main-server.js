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

  if (PageComponent === ProductDetailPage) {
    // 상품 정보 설정
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: initData.product,
    });

    // 관련 상품 설정
    if (initData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initData.relatedProducts,
      });
    }
  }

  // 동적 title 생성
  let pageTitle = PageComponent.title || "쇼핑몰";
  if (PageComponent === ProductDetailPage && initData?.product) {
    pageTitle = `${initData.product.title} | 쇼핑몰`;
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: PageComponent(),
    data: initData,
  };
};
