import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createStore } from "./lib/createStore.js";
import { initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { ProductCard } from "./components/ProductCard.js";
import { SearchBar } from "./components/SearchBar.js";
import { ProductList } from "./components/ProductList.js";
import { Logo } from "./components/Logo.js";
import { Footer } from "./components/Footer.js";
import { CartModal } from "./components/CartModal.js";
import { Toast } from "./components/Toast.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let items;

try {
  // SSR 빌드된 환경에서는 상대 경로로 찾기
  const itemsPath = path.resolve(__dirname, "./mocks/items.json");
  items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
} catch (error) {
  console.log("1: Failed to load items from SSR path, trying alternative paths...", error);
  // 개발 환경 또는 다른 경로
  try {
    const itemsPath = path.resolve(__dirname, "../src/mocks/items.json");
    items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  } catch (error) {
    console.log("2: Failed to load items from dev path, trying alternative path...", error);
    // static-site-generate.js가 packages/vanilla에서 실행되므로
    const itemsPath = path.resolve(__dirname, "./src/mocks/items.json");
    items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  }
}

// title의 공백 정규화
items = items.map((item) => ({
  ...item,
  title: item.title.replace(/\s+/g, " ").trim(),
}));

// Mock API 함수들
function getUniqueCategories() {
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) {
      categories[cat1] = {};
    }

    if (cat2 && !categories[cat1][cat2]) {
      categories[cat1][cat2] = {};
    }
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

function mockGetProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;

  const page = params.current ?? params.page ?? 1;

  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

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
    filters: {
      search,
      category1,
      category2,
      sort,
    },
  };
}

function mockGetProduct(productId) {
  const product = items.find((item) => item.productId === productId);
  if (!product) return null;

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

function mockGetCategories() {
  return getUniqueCategories();
}

// 서버 라우터
class ServerRouter {
  constructor() {
    this.routes = [];
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
    const pathname = url.split("?")[0];
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
}

function parseQuery(url) {
  const queryString = url.includes("?") ? url.split("?")[1] : "";
  const params = new URLSearchParams(queryString);
  const query = {};

  for (const [key, value] of params) {
    query[key] = value;
  }
  return query;
}

function renderLayout(title, content) {
  return `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          ${Logo()}
          <button id="cart-icon-btn" class="relative p-2 text-gray-600 hover:text-gray-900">
            🛒
            <span class="cart-count hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"></span>
          </button>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${content}
      </main>

      ${Footer()}
      
      <!-- CartModal 컴포넌트 - 초기에는 isOpen=false로 숨김 -->
      <div id="cart-modal-container">
        ${CartModal({ items: [], selectedAll: false, isOpen: false })}
      </div>
      
      <!-- Toast 컴포넌트 - 초기에는 isVisible=false로 숨김 -->
      <div id="toast-container">
        ${Toast({ isVisible: false, message: "", type: "info" })}
      </div>
    </div>
  `;
}

function renderHomePage(productState, query) {
  const { products, totalCount, categories } = productState;
  const { search = "", limit = "20", sort = "price_asc", category1 = "", category2 = "" } = query;

  const searchBarHTML = SearchBar({
    searchQuery: search,
    limit: Number(limit),
    sort,
    category: { category1, category2 },
    categories,
  });

  const productListHTML = ProductList({
    products,
    loading: false,
    error: null,
    totalCount,
    hasMore: false,
  });

  const content = `
    ${searchBarHTML}
    ${productListHTML}
  `;

  return renderLayout("쇼핑몰", content);
}

function renderProductDetailPage(productState) {
  const { currentProduct } = productState;

  if (!currentProduct) {
    const content = `
      <div class="flex items-center justify-center" style="min-height: 60vh;">
        <div class="text-center">
          <h1 class="text-xl font-bold text-gray-900 mb-2">상품을 찾을 수 없습니다</h1>
          <a href="/" data-link class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">홈으로</a>
        </div>
      </div>
    `;
    return renderLayout("상품을 찾을 수 없습니다", content);
  }

  // 관련 상품 가져오기
  const relatedProducts = items
    .filter((item) => item.category1 === currentProduct.category1 && item.productId !== currentProduct.productId)
    .slice(0, 4);

  const relatedProductsHTML =
    relatedProducts.length > 0
      ? `
    <div class="mt-12">
      <h2 class="text-xl font-bold mb-6">관련 상품</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${relatedProducts.map((product) => ProductCard(product)).join("")}
      </div>
    </div>
  `
      : "";

  const content = `
    <div class="bg-white rounded-lg shadow-md p-8">
      <div class="text-sm text-gray-600 mb-4">상품 상세</div>
      <h1 class="text-2xl font-bold mb-4">${currentProduct.title}</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src="${currentProduct.image}" alt="${currentProduct.title}" class="w-full rounded-lg" />
        </div>
        <div>
          <p class="text-gray-600 mb-4">${currentProduct.brand}</p>
          <p class="text-3xl font-bold text-blue-600 mb-6">${parseInt(currentProduct.lprice).toLocaleString()}원</p>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">수량</label>
            <div class="flex items-center gap-2">
              <button id="quantity-decrease" class="px-3 py-1 border border-gray-300 rounded-md">-</button>
              <input type="number" id="quantity-input" value="1" min="1" 
                     class="w-20 px-3 py-1 border border-gray-300 rounded-md text-center" />
              <button id="quantity-increase" class="px-3 py-1 border border-gray-300 rounded-md">+</button>
            </div>
          </div>
          <button id="add-to-cart-btn" 
                  class="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700"
                  data-product-id="${currentProduct.productId}">
            장바구니 담기
          </button>
        </div>
      </div>
      ${relatedProductsHTML}
    </div>
  `;

  return renderLayout(currentProduct.title, content);
}

function render404Page() {
  const content = `
    <div class="flex items-center justify-center" style="min-height: 60vh;">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-gray-600 mb-4">페이지를 찾을 수 없습니다</p>
        <a href="/" data-link class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">홈으로</a>
      </div>
    </div>
  `;

  return renderLayout("404", content);
}

// 메인 렌더링 함수
export async function render(url) {
  console.log("[SSR] Incoming URL:", url);

  const router = new ServerRouter();
  const query = parseQuery(url);

  // 라우트 등록
  router.addRoute("/product/:id/", "product-detail");
  router.addRoute("/", "home");
  router.addRoute(".*", "404");

  // 라우트 찾기
  const route = router.findRoute(url);
  console.log("[SSR] Matched route:", route?.path || "null", "Handler:", route?.handler || "none");

  if (!route) {
    return {
      html: render404Page(),
      head: "<title>404 - 페이지를 찾을 수 없습니다</title>",
      initialData: null,
    };
  }

  // Store 초기화
  const productReducer = (state, action) => {
    switch (action.type) {
      case PRODUCT_ACTIONS.SETUP:
        return { ...state, ...action.payload };
      case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
        return { ...state, currentProduct: action.payload, loading: false };
      default:
        return state;
    }
  };

  const productStore = createStore(productReducer, { ...initialProductState });

  let initialData = null;

  if (route.path === "/") {
    // 홈 페이지: 상품 목록 + 카테고리
    const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = query;
    const page = query.current ?? query.page ?? 1;

    const productsData = mockGetProducts({
      page,
      limit: parseInt(limit),
      search,
      category1,
      category2,
      sort,
    });
    const categoriesData = mockGetCategories();

    initialData = {
      products: productsData.products,
      categories: categoriesData,
      totalCount: productsData.pagination.total,
    };

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    const productState = productStore.getState();
    const html = renderHomePage(productState, query);

    return {
      html,
      head: "<title>쇼핑몰 - 홈</title>",
      initialData,
    };
  } else if (route.path === "/product/:id/") {
    // 상품 상세 페이지
    const productId = route.params.id;
    const productData = mockGetProduct(productId);

    if (!productData) {
      return {
        html: render404Page(),
        head: "<title>404 - 상품을 찾을 수 없습니다</title>",
        initialData: null,
      };
    }

    initialData = {
      currentProduct: productData,
      loading: false,
    };

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: productData,
    });

    const productState = productStore.getState();
    const html = renderProductDetailPage(productState);

    return {
      html,
      head: `<title>${productData.title} - 쇼핑몰</title>`,
      initialData,
    };
  }

  // 404 페이지
  return {
    html: render404Page(),
    head: "<title>404 - 페이지를 찾을 수 없습니다</title>",
    initialData: null,
  };
}
