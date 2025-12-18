import { ServerRouter } from "./lib/index.js";
import { renderHomePageView, renderNotFoundPageView, renderProductDetailPageView } from "./views/pages.js";

// 서버용 API 함수들 (fetch 대신 직접 데이터 반환)
import items from "./mocks/items.json";

// 서버용 라우터 생성 (server.js에서 이미 base URL을 제거하고 전달함)
const createServerRouter = () => {
  const router = new ServerRouter("");
  router.addRoute("/", () => "home");
  router.addRoute("/product/:id/", () => "product");
  router.addRoute(".*", () => "notfound");
  return router;
};

// 서버용 API 함수들
const getProductsFromData = (params = {}) => {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  let filtered = [...items];

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchLower) || item.brand?.toLowerCase().includes(searchLower),
    );
  }

  if (category1) {
    filtered = filtered.filter((item) => item.category1 === category1);
  }
  if (category2) {
    filtered = filtered.filter((item) => item.category2 === category2);
  }

  if (sort === "price_asc") {
    filtered.sort((a, b) => Number(a.lprice) - Number(b.lprice));
  } else if (sort === "price_desc") {
    filtered.sort((a, b) => Number(b.lprice) - Number(a.lprice));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const products = filtered.slice(start, start + Number(limit));

  return { products, pagination: { total, page, limit } };
};

const getProductFromData = (productId) => {
  return items.find((item) => item.productId === productId) || null;
};

const getCategoriesFromData = () => {
  const categories = {};
  items.forEach((item) => {
    if (item.category1) {
      if (!categories[item.category1]) {
        categories[item.category1] = {};
      }
      if (item.category2 && !categories[item.category1][item.category2]) {
        categories[item.category1][item.category2] = {};
      }
    }
  });
  return categories;
};

// SSR에서 공용 PageWrapper를 사용하기 위한 최소 layout state
const ssrCart = { items: [], selectedAll: false, isOpen: false };
const ssrUi = { cartModal: { isOpen: false }, toast: { isVisible: false, message: "", type: "info" } };

// 데이터 프리페칭 함수
async function prefetchData(route, params, query) {
  if (route?.path === "/") {
    // mockGetProducts + mockGetCategories
    const [{ products, pagination }, categories] = await Promise.all([
      Promise.resolve(getProductsFromData(query)),
      Promise.resolve(getCategoriesFromData()),
    ]);

    return {
      products,
      categories,
      totalCount: pagination.total,
    };
  } else if (route?.path === "/product/:id/") {
    // mockGetProduct(params.id)
    const product = getProductFromData(params.id);

    let relatedProducts = [];
    if (product?.category2) {
      const { products } = getProductsFromData({ category2: product.category2, limit: 20 });
      relatedProducts = products.filter((p) => p.productId !== params.id);
    }

    return {
      currentProduct: product,
      relatedProducts,
    };
  }

  return null;
}

export async function render(url, query = {}) {
  // 1. 라우트 매칭
  const router = createServerRouter();
  router.navigate(url, query);
  const route = router.route;
  const params = router.params;

  // 2. 데이터 프리페칭
  const initialData = await prefetchData(route, params, query);

  // 3. HTML 생성 및 SEO 타이틀 설정
  let html = "";
  let title = "쇼핑몰";

  if (route?.path === "/") {
    html = renderHomePageView({
      productState: {
        products: initialData?.products ?? [],
        categories: initialData?.categories ?? {},
        totalCount: initialData?.totalCount ?? 0,
        loading: false,
        error: null,
      },
      query,
      cart: ssrCart,
      ui: ssrUi,
    });
    title = "쇼핑몰 - 홈";
  } else if (route?.path === "/product/:id/") {
    html = renderProductDetailPageView({
      productState: {
        currentProduct: initialData?.currentProduct ?? null,
        relatedProducts: initialData?.relatedProducts ?? [],
        loading: false,
        error: initialData?.currentProduct ? null : "요청하신 상품이 존재하지 않습니다.",
      },
      cart: ssrCart,
      ui: ssrUi,
    });
    if (initialData?.currentProduct) {
      title = `${initialData.currentProduct.title} - 쇼핑몰`;
    }
  } else {
    html = renderNotFoundPageView({ cart: ssrCart, ui: ssrUi });
    title = "페이지를 찾을 수 없습니다 - 쇼핑몰";
  }

  // 4. head 스크립트 생성 (SEO 메타태그 + 초기 데이터)
  const head = `
    <title>${title}</title>
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(initialData || {})};
    </script>
  `.trim();

  return { html, head, initialData };
}
