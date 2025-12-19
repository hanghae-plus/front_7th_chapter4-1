import { serverRouter } from "./router/serverRouter.js";
import { setSSRContext } from "./router/ssrContext.js";
import { HomePage, ProductDetailPage } from "./pages";
import { getProducts, getProduct, getCategories } from "./api/productApi.js";

/**
 * URL에서 query 파라미터 추출
 * Express의 req.query 대신 직접 파싱하여 동시성 문제 해결
 */
const parseQueryFromUrl = (url) => {
  try {
    const parsed = new URL(url, "http://localhost");
    return Object.fromEntries(parsed.searchParams);
  } catch {
    return {};
  }
};

/**
 * 데이터 프리페칭 (Store 없이 순수 데이터 반환)
 * 동시성 안전: 요청마다 독립적인 데이터 생성
 */
const prefetchData = async (handler, params, query) => {
  if (handler === HomePage) {
    const [productsData, categories] = await Promise.all([getProducts(query), getCategories()]);
    const { products, pagination } = productsData;

    return {
      data: { products, categories, totalCount: pagination.total },
      head: "<title>쇼핑몰 - 홈</title>",
    };
  }

  if (handler === ProductDetailPage) {
    const product = await getProduct(params.id);

    // 관련 상품 가져오기 (같은 카테고리)
    const relatedParams = {
      category1: product.category1,
      category2: product.category2,
      limit: 20,
    };
    const relatedData = await getProducts(relatedParams);
    const relatedProducts = relatedData.products.filter((p) => p.productId !== product.productId);

    return {
      data: { product, relatedProducts },
      head: `<title>${product.title} - 쇼핑몰</title>`,
    };
  }

  return { data: null, head: "<title>쇼핑몰</title>" };
};

/**
 * SSR 렌더링 메인 함수
 * @param {string} url - 요청 URL (query string 포함)
 */
export const render = async (url) => {
  // URL에서 직접 query 파싱 (Express req.query 의존 제거)
  const query = parseQueryFromUrl(url);
  const route = serverRouter.findRoute(url);

  // 데이터 프리페칭 먼저 수행
  const { data: initialData, head } = await prefetchData(route?.handler, route?.params, query);

  // SSR 컨텍스트 설정 (params + data 포함)
  setSSRContext({ url, query, params: route?.params ?? {}, data: initialData });

  try {
    // handler 호출
    const html = route ? route.handler() : "<div>Not Found</div>";

    return {
      html,
      head,
      initialData,
    };
  } finally {
    // 렌더링 후 컨텍스트 클리어 (메모리 누수 방지)
    setSSRContext(null);
  }
};
