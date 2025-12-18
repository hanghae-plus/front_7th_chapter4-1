import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { getProducts, getProduct, getCategories } from "./api/productApi.js";
import { ServerRouter } from "./lib/ServerRouter.js";
import { createServerStores } from "./stores/createServerStore.js";
import { parseUrl } from "./utils/ssrUtils.js";
import { renderHomePage, renderProductDetailPage, renderNotFoundPage } from "./pages/server/index.js";

/**
 * 서버 사이드 렌더링 메인 함수
 * @param {string} url - 요청 URL
 * @returns {Promise<{ html: string, head: string, initialData: Object }>}
 */
export async function render(url) {
  // URL 파싱
  const { pathname, query } = parseUrl(url);

  // 서버용 Store 초기화
  const stores = createServerStores();

  // 라우터 설정
  const router = new ServerRouter();
  router.addRoute("/", "home");
  router.addRoute("/product/:id/", "product");
  router.addRoute("/404", "notfound");

  // 라우트 매칭
  const route = router.findRoute(pathname);
  const routePath = route?.path || "notfound";
  const params = route?.params || {};

  // 데이터 프리페칭
  let initialData = {};

  if (routePath === "/") {
    // 홈페이지: 상품 목록 + 카테고리
    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;

    const [productsData, categories] = await Promise.all([
      getProducts({
        page,
        limit,
        search: query.search || "",
        category1: query.category1 || "",
        category2: query.category2 || "",
        sort: query.sort || "price_asc",
      }),
      getCategories(),
    ]);

    stores.productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: productsData.products,
        totalCount: productsData.pagination.total,
        categories,
        loading: false,
        error: null,
      },
    });

    initialData = {
      products: productsData.products,
      categories,
      totalCount: productsData.pagination.total,
    };
  } else if (routePath === "/product/:id/") {
    // 상품 상세 페이지
    const product = await getProduct(params.id);

    if (product && !product.error) {
      // 관련 상품 조회 (같은 카테고리)
      const relatedData = await getProducts({
        category1: product.category1,
        limit: 20,
      });
      const relatedProducts = relatedData.products.filter((p) => p.productId !== params.id);

      stores.productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });
      stores.productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: relatedProducts,
      });

      initialData = {
        currentProduct: product,
        relatedProducts,
      };
    } else {
      stores.productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_ERROR,
        payload: "상품을 찾을 수 없습니다.",
      });
    }
  }

  // HTML 렌더링
  let html = "";

  if (routePath === "/") {
    html = renderHomePage(stores, query);
  } else if (routePath === "/product/:id/") {
    html = renderProductDetailPage(stores);
  } else {
    html = renderNotFoundPage(stores);
  }

  // SEO Head 태그 생성
  let head = "";

  if (routePath === "/") {
    head = `<title>쇼핑몰 - 홈</title>
      <meta name="description" content="다양한 상품을 만나보세요">`;
  } else if (routePath === "/product/:id/") {
    const product = stores.productStore.getState().currentProduct;
    if (product) {
      head = `
        <title>${product.title} - 쇼핑몰</title>
        <meta name="description" content="${product.brand} - ${Number(product.lprice).toLocaleString()}원">
      `;
    } else {
      head = `
        <title>상품을 찾을 수 없습니다 - 쇼핑몰</title>
      `;
    }
  } else {
    head = `
      <title>페이지를 찾을 수 없습니다 - 쇼핑몰</title>
    `;
  }

  return { html, head, initialData };
}
