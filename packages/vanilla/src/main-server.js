import { HomePageView } from "./pages/HomePage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ServerRouter } from "./lib/ServerRouter.js";
import items from "./mocks/items.json";
import { createStore } from "./lib/createStore.js";
import { productReducer, initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

// handlers.js에서 함수 가져오기
function getUniqueCategories() {
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

function filterProducts(products, query) {
  let filtered = [...products];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
        break;
      default:
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

/**
 * 서버에서 데이터 프리페칭
 * @param {Object} route - 매칭된 라우트 정보
 * @param {Object} params - 라우트 파라미터
 * @param {Object} productStore - productStore 인스턴스
 * @param {string} url - 요청 URL
 */
async function prefetchData(route, params, productStore, url) {
  if (route.path === "/") {
    // 홈페이지: 상품 목록 + 카테고리
    const urlObj = new URL(url, "http://localhost");
    const query = Object.fromEntries(urlObj.searchParams);

    const page = parseInt(query.page || query.current || 1);
    const limit = parseInt(query.limit || 20);
    const sort = query.sort || "price_asc";

    // 필터링
    const filteredProducts = filterProducts(items, {
      search: query.search || "",
      category1: query.category1 || "",
      category2: query.category2 || "",
      sort,
    });

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // 카테고리
    const categories = getUniqueCategories();

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: paginatedProducts,
        categories,
        totalCount: filteredProducts.length,
        loading: false,
        status: "done",
      },
    });
  } else if (route.path === "/product/:id/") {
    // 상품 상세 페이지
    const product = items.find((item) => item.productId === params.id);

    if (!product) {
      throw new Error("Product not found");
    }

    // 상세 정보 추가
    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: detailProduct,
    });
  }
}

export async function render(url) {
  // 1. URL 파싱
  const urlObj = new URL(url, "http://localhost");
  const query = Object.fromEntries(urlObj.searchParams);

  // 2. Store 초기화
  const productStore = createStore(productReducer, initialProductState);

  // 3. ServerRouter 생성 및 라우트 등록
  const serverRouter = new ServerRouter();
  serverRouter.query = query;

  serverRouter.addRoute("/", () => HomePageView({ store: productStore, query }));
  serverRouter.addRoute("/product/:id/", (params) => ProductDetailPage({ store: productStore, params }));
  serverRouter.addRoute(".*", () => NotFoundPage()); // 404 페이지는 와일드카드로 마지막에 등록

  // 4. 라우트 매칭
  serverRouter.push(url);
  const route = serverRouter.route;

  if (!route) {
    return {
      head: "<title>404 | 쇼핑몰</title>",
      html: NotFoundPage(),
      initialData: null,
    };
  }

  // 5. 데이터 프리페칭 (라우트 매칭 후, HTML 생성 전)
  await prefetchData(route, route.params, productStore, url);

  // 6. HTML 생성 (SSR-safe 컴포넌트 사용)
  let html, head;
  if (route.path === "/") {
    html = HomePageView({ store: productStore, query });
    head = "<title>메인 | 쇼핑몰</title>";
  } else if (route.path === "/product/:id/") {
    html = ProductDetailPage({ store: productStore, params: route.params });
    head = `<title>상품 ${route.params.id} 상세 | 쇼핑몰</title>`;
  }

  // 7. 초기 데이터 직렬화
  const initialData = {
    productStore: productStore.getState(),
  };

  return { html, head, initialData };
}
