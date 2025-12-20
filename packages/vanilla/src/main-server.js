import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { PRODUCT_ACTIONS, productStore } from "./stores";
import { BASE_URL } from "./constants.js";

export const render = async (url, query) => {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 쿼리 파라미터를 먼저 설정 (getServerSideProps에서 사용)
  router.query = query;

  // URL에서 pathname만 추출하여 push (쿼리 파라미터 제거, base path 제거)
  const urlObj = new URL(url, "http://localhost:3000");
  let pathname = urlObj.pathname;

  // base path 제거
  if (BASE_URL !== "/" && pathname.startsWith(BASE_URL)) {
    pathname = pathname.slice(BASE_URL.length);
    // pathname이 비어있으면 "/"로 설정
    if (!pathname || pathname === "") {
      pathname = "/";
    }
  }

  router.push(pathname);

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

  // 동적 title 생성 (E2E 테스트 형식에 맞춤)
  let pageTitle = "쇼핑몰 - 홈";
  if (PageComponent === ProductDetailPage && initData?.product) {
    pageTitle = `${initData.product.title} - 쇼핑몰`;
  } else if (PageComponent === NotFoundPage) {
    pageTitle = "404 - 쇼핑몰";
  }

  // E2E 테스트 형식에 맞게 데이터 변환 (HomePage의 경우)
  let dataForClient = initData;
  if (PageComponent === HomePage && initData) {
    dataForClient = {
      products: initData.products,
      categories: initData.categories,
      totalCount: initData.pagination?.total ?? 0,
    };
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: PageComponent(),
    data: dataForClient,
  };
};
