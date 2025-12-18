import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { createStore } from "./lib/createStore.js";
import { initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS, CART_ACTIONS, UI_ACTIONS } from "./stores/actionTypes.js";
import { HomePage } from "./pages/HomePage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// items.json 로드

const itemsPath = path.resolve(__dirname, "./mocks/items.json");
const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));

// Mock 데이터 함수들
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

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  // 카테고리 필터링
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  // 정렬
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

export async function mockGetProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: page > 1,
    },
  };
}

export async function mockGetProduct(productId) {
  const product = items.find((item) => item.productId === productId);

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
  };
}

export async function mockGetCategories() {
  return getUniqueCategories();
}

// 서버용 라우터
class ServerRouter {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.query = {};
    this.params = {};
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/")
      .replace(/\.\*/g, ".*");

    const regex = new RegExp(`^${regexPath}$`);

    this.routes.push({
      path,
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    const [pathname] = url.split("?");
    for (const route of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { ...route, params };
      }
    }
    return null;
  }

  get target() {
    return this.currentRoute?.handler;
  }
}

// 데이터 프리페칭
async function prefetchData(route, params, query, productStore) {
  if (route.path === "/") {
    // 홈 페이지: 상품 목록 + 카테고리
    const [productsData, categories] = await Promise.all([mockGetProducts(query), mockGetCategories()]);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: productsData.products,
        totalCount: productsData.pagination.total,
        categories,
        loading: false,
        error: null,
        status: "done",
      },
    });
  } else if (route.path === "/product/:id/") {
    // 상품 상세 페이지
    const productId = params.id;
    const product = await mockGetProduct(productId);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    // 관련 상품 로드
    if (product.category2) {
      const relatedData = await mockGetProducts({
        category2: product.category2,
        limit: 20,
      });

      const relatedProducts = relatedData.products.filter((p) => p.productId !== productId);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: relatedProducts,
      });
    }
  }
}

// 쿼리 파싱
function parseQuery(search) {
  const params = new URLSearchParams(search);
  const query = {};
  for (const [key, value] of params) {
    query[key] = value;
  }
  return query;
}

export const render = async (url) => {
  try {
    // URL 파싱
    const [pathname, search] = url.split("?");
    const actualPathname = pathname || "/"; // 빈 문자열이면 "/"로 처리
    const query = parseQuery(search || "");

    // 서버용 라우터 생성
    const router = new ServerRouter();
    router.addRoute("/", HomePage);
    router.addRoute("/product/:id/", ProductDetailPage);
    router.addRoute(".*", NotFoundPage);

    // 라우트 매칭
    const route = router.findRoute(actualPathname);
    if (!route) {
      return {
        html: NotFoundPage(),
        head: "<title>404 - Page Not Found</title>",
        initialData: null,
      };
    }

    router.currentRoute = route;
    router.params = route.params;
    router.query = query;

    // Store 초기화 (각 요청마다 새로 생성)
    const productReducer = (state, action) => {
      switch (action.type) {
        case PRODUCT_ACTIONS.SET_STATUS:
          return { ...state, status: action.payload };
        case PRODUCT_ACTIONS.SET_CATEGORIES:
          return { ...state, categories: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_PRODUCTS:
          return {
            ...state,
            products: action.payload.products,
            totalCount: action.payload.totalCount,
            loading: false,
            error: null,
            status: "done",
          };
        case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
          return { ...state, currentProduct: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS:
          return { ...state, relatedProducts: action.payload, status: "done" };
        case PRODUCT_ACTIONS.SETUP:
          return { ...state, ...action.payload };
        default:
          return state;
      }
    };

    const productStore = createStore(productReducer, initialProductState);

    // cartStore 생성
    const initialCartState = { items: [], selectedAll: false };
    const cartReducer = (state, action) => {
      switch (action.type) {
        case CART_ACTIONS.LOAD_FROM_STORAGE:
          return { ...state, ...action.payload };
        default:
          return state;
      }
    };
    const cartStore = createStore(cartReducer, initialCartState);

    // uiStore 생성
    const initialUiState = {
      cartModal: { isOpen: false },
      globalLoading: false,
      toast: { isVisible: false, message: "", type: "info" },
    };
    const uiReducer = (state, action) => {
      switch (action.type) {
        case UI_ACTIONS.OPEN_CART_MODAL:
          return { ...state, cartModal: { isOpen: true } };
        case UI_ACTIONS.CLOSE_CART_MODAL:
          return { ...state, cartModal: { isOpen: false } };
        default:
          return state;
      }
    };
    const uiStore = createStore(uiReducer, initialUiState);

    // 전역 객체에 임시로 설정 (컴포넌트에서 사용)
    global.serverContext = {
      productStore,
      cartStore,
      uiStore,
      router,
    };

    // 데이터 프리페칭
    await prefetchData(route, route.params, query, productStore);

    // HTML 생성
    const html = route.handler();

    // 초기 데이터 준비
    const initialData = {
      ...productStore.getState(),
    };

    // head 태그 생성 (동적 타이틀)
    let title = "쇼핑몰";
    if (route.path === "/") {
      title = "쇼핑몰 - 홈";
    } else if (route.path === "/product/:id/") {
      const currentProduct = productStore.getState().currentProduct;
      if (currentProduct) {
        title = `${currentProduct.title} - 쇼핑몰`;
      }
    }
    const head = `<title>${title}</title>`;

    // 정리
    delete global.serverContext;

    return {
      html,
      head,
      initialData,
    };
  } catch (error) {
    console.error("Render error:", error);
    return {
      html: `<div>Error: ${error.message}</div>`,
      head: "<title>Error</title>",
      initialData: null,
    };
  }
};
