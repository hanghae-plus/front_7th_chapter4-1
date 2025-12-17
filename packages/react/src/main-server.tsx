import { productStore, initialProductState, PRODUCT_ACTIONS } from "./entities/products/productStore";
import type { Product, Categories } from "./entities/products/types";

// items.json 직접 로드 (서버 API 미들웨어와 동일한 방식)
// SSG 빌드 시에는 global.apiItems 사용, 그 외에는 직접 import
import itemsDataImport from "./mocks/items.json";
const itemsData = (global as { apiItems?: Product[] }).apiItems || itemsDataImport;

/**
 * 서버 사이드에서 라우트 매칭
 * 클라이언트 Router와 동일한 로직이지만 window 객체 없이 동작
 */
function matchRoute(url: string, baseUrl: string) {
  // baseUrl 제거
  let pathname = url;
  if (baseUrl && pathname.startsWith(baseUrl)) {
    pathname = pathname.slice(baseUrl.length);
  }
  pathname = pathname.split("?")[0]; // 쿼리 제거
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  // 홈페이지: / 경로
  if (pathname === "/" || pathname === "") {
    return { path: "/", params: {}, handler: "HomePage" };
  }

  // 상품 상세 페이지: /product/:id/ 경로
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return {
      path: "/product/:id/",
      params: { id: productMatch[1] },
      handler: "ProductDetailPage",
    };
  }

  // 404: 그 외 모든 경로
  return { path: null, params: {}, handler: "NotFoundPage" };
}

/**
 * 상품 필터링 유틸리티
 */
function filterProducts(products: Product[], query: Record<string, string> = {}) {
  const { search = "", category1 = "", category2 = "", sort = "price_asc" } = query;
  let filtered = [...products];

  // 검색 필터
  if (search) {
    const searchTerm = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) || (item.brand && item.brand.toLowerCase().includes(searchTerm)),
    );
  }

  // 카테고리 필터
  if (category1) {
    filtered = filtered.filter((item) => item.category1 === category1);
  }
  if (category2) {
    filtered = filtered.filter((item) => item.category2 === category2);
  }

  // 정렬
  switch (sort) {
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
  }

  return filtered;
}

/**
 * 카테고리 추출 유틸리티
 */
function getUniqueCategories(products: Product[]): Categories {
  const categories: Record<string, Record<string, Record<string, never>>> = {};

  products.forEach((product) => {
    if (product.category1 && !categories[product.category1]) {
      categories[product.category1] = {};
    }
    if (product.category1 && product.category2 && !categories[product.category1][product.category2]) {
      categories[product.category1][product.category2] = {} as Record<string, never>; // 빈 객체로 설정
    }
  });

  return categories as Categories;
}

/**
 * 홈페이지 데이터 프리페칭
 */
function prefetchHomePageData(query: Record<string, string>, items: Product[]) {
  const page = parseInt(query.page ?? query.current ?? "1") || 1;
  const limit = parseInt(query.limit ?? "20") || 20;
  const search = query.search || "";
  const category1 = query.category1 || "";
  const category2 = query.category2 || "";
  const sort = query.sort || "price_asc";

  // 상품 필터링
  const filteredProducts = filterProducts(items, { search, category1, category2, sort });

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const products = filteredProducts.slice(startIndex, endIndex);
  const totalCount = filteredProducts.length;

  // 카테고리 추출
  const categories = getUniqueCategories(items);

  return {
    products,
    categories,
    totalCount,
  };
}

/**
 * SearchBar HTML 생성
 */
function renderSearchBar({
  searchQuery = "",
  limit = 20,
  sort = "price_asc",
  category = {},
  categories = {},
}: {
  searchQuery?: string;
  limit?: number;
  sort?: string;
  category?: { category1?: string; category2?: string };
  categories?: Categories;
}) {
  const categoryList = Object.keys(categories).length > 0 ? Object.keys(categories) : [];
  const OPTION_LIMITS = [10, 20, 50, 100];
  const OPTION_SORTS = [
    { value: "price_asc", label: "가격 낮은순" },
    { value: "price_desc", label: "가격 높은순" },
    { value: "name_asc", label: "이름순" },
    { value: "name_desc", label: "이름 역순" },
  ];

  const limitOptions = OPTION_LIMITS.map(
    (value) => `<option value="${value}" ${Number(limit) === value ? "selected" : ""}>${value}개</option>`,
  ).join("");

  const sortOptions = OPTION_SORTS.map(
    ({ value, label }) => `<option value="${value}" ${sort === value ? "selected" : ""}>${label}</option>`,
  ).join("");

  const categoryButtons = categoryList
    .map(
      (categoryKey) => `
      <button 
        data-category1="${categoryKey}"
        class="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
               bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        ${categoryKey}
      </button>
    `,
    )
    .join("");

  const breadcrumbItems = ["전체", category.category1, category.category2]
    .filter((cat, index) => index === 0 || Boolean(cat))
    .map((cat, index) => {
      if (index === 0) {
        return `<button data-breadcrumb="reset" class="text-xs hover:text-blue-800 hover:underline">전체</button>`;
      } else if (index === 1) {
        return `<span class="text-xs text-gray-500">&gt;</span><button data-breadcrumb="category1" data-category1="${cat}" class="text-xs hover:text-blue-800 hover:underline">${cat}</button>`;
      } else {
        return `<span class="text-xs text-gray-500">&gt;</span><span class="text-xs text-gray-600 cursor-default">${cat}</span>`;
      }
    })
    .join("");

  const category2Buttons =
    category.category1 && categories[category.category1]
      ? Object.keys(categories[category.category1])
          .map((category2Key) => {
            const isSelected = category.category2 === category2Key;
            return `
            <button 
              data-category1="${category.category1}"
              data-category2="${category2Key}"
              class="category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                     ${
                       isSelected
                         ? "bg-blue-100 border-blue-300 text-blue-800"
                         : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                     }"
            >
              ${category2Key}
            </button>
          `;
          })
          .join("")
      : "";

  return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <!-- 검색창 -->
      <div class="mb-4">
        <div class="relative">
          <input type="text" 
                 id="search-input"
                 placeholder="상품명을 검색해보세요..." 
                 value="${searchQuery}"
                 class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 필터 옵션 -->
      <div class="space-y-3">
        <!-- 카테고리 필터 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">카테고리:</label>
            ${breadcrumbItems}
          </div>
          
          <!-- 1depth 카테고리 -->
          ${!category.category1 ? `<div class="flex flex-wrap gap-2">${categoryList.length > 0 ? categoryButtons : '<div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>'}</div>` : ""}
          
          <!-- 2depth 카테고리 -->
          ${category.category1 && categories[category.category1] ? `<div class="space-y-2"><div class="flex flex-wrap gap-2">${category2Buttons}</div></div>` : ""}
        </div>

        <!-- 기존 필터들 -->
        <div class="flex gap-2 items-center justify-between">
          <!-- 페이지당 상품 수 -->
          <div class="flex items-center gap-2">
            <label for="limit-select" class="text-sm text-gray-600">개수:</label>
            <select id="limit-select" class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              ${limitOptions}
            </select>
          </div>

          <!-- 정렬 -->
          <div class="flex items-center gap-2">
            <label for="sort-select" class="text-sm text-gray-600">정렬:</label>
            <select id="sort-select" class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              ${sortOptions}
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ProductCard HTML 생성
 */
function renderProductCard(product: Product) {
  const { productId, title, image, lprice, brand } = product;
  const price = Number(lprice);

  return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card" 
         data-product-id="${productId}">
      <!-- 상품 이미지 -->
      <div class="aspect-square bg-gray-100 overflow-hidden cursor-pointer product-image">
        <img src="${image}" 
             alt="${title}" 
             class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
             loading="lazy">
      </div>
      
      <!-- 상품 정보 -->
      <div class="p-3">
        <div class="cursor-pointer product-info mb-3">
          <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            ${title}
          </h3>
          <p class="text-xs text-gray-500 mb-2">${brand}</p>
          <p class="text-lg font-bold text-gray-900">
            ${price.toLocaleString()}원
          </p>
        </div>
        
        <!-- 장바구니 버튼 -->
        <button class="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md 
                       hover:bg-blue-700 transition-colors add-to-cart-btn"
                data-product-id="${productId}">
          장바구니 담기
        </button>
      </div>
    </div>
  `;
}

/**
 * ProductList HTML 생성
 */
function renderProductList({
  products = [],
  loading = false,
  error = null,
  totalCount = 0,
}: {
  products?: Product[];
  loading?: boolean;
  error?: string | null;
  totalCount?: number;
}) {
  // 에러 상태
  if (error) {
    return `
      <div class="text-center py-12">
        <div class="text-red-500 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
        <p class="text-gray-600 mb-4">${error}</p>
        <button id="retry-btn" 
                class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          다시 시도
        </button>
      </div>
    `;
  }

  // 빈 상태 (검색 결과 없음)
  if (!loading && products.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">상품을 찾을 수 없습니다</h3>
        <p class="text-gray-600">다른 검색어를 시도해보세요.</p>
      </div>
    `;
  }

  return `
    <div>
      <!-- 상품 개수 정보 -->
      ${totalCount > 0 ? `<div class="mb-4 text-sm text-gray-600">총 <span class="font-medium text-gray-900">${totalCount.toLocaleString()}개</span>의 상품</div>` : ""}
      
      <!-- 상품 그리드 -->
      <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
        ${products.map((product) => renderProductCard(product)).join("")}
      </div>
      
      <!-- 무한 스크롤 트리거 -->
      <div id="scroll-trigger" class="h-4"></div>
    </div>
  `;
}

/**
 * PageWrapper HTML 생성
 */
function renderPageWrapper({ headerLeft, children }: { headerLeft: string; children: string }) {
  return `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-md mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            ${headerLeft}
            <div class="flex items-center space-x-2">
              <!-- 장바구니 아이콘 -->
              <button id="cart-icon-btn" class="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 2H3m4 11v6a1 1 0 001 1h1a1 1 0 001-1v-6M13 13v6a1 1 0 001 1h1a1 1 0 001-1v-6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main class="max-w-md mx-auto px-4 py-4">
        ${children}
      </main>
    </div>
  `;
}

/**
 * 상품 상세 페이지 HTML 생성
 */
function renderProductDetail(product: Product, relatedProducts: Product[] = []) {
  const { productId, title, image, lprice, brand, category1, category2 } = product;
  const price = Number(lprice);

  // 브레드크럼 생성
  const breadcrumbItems = [];
  if (category1) breadcrumbItems.push({ name: category1, category: "category1", value: category1 });
  if (category2) breadcrumbItems.push({ name: category2, category: "category2", value: category2 });

  const breadcrumb =
    breadcrumbItems.length > 0
      ? `
      <nav class="mb-4">
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" data-link class="hover:text-blue-600 transition-colors">홈</a>
          ${breadcrumbItems
            .map(
              (item) => `
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <button class="breadcrumb-link" data-${item.category}="${item.value}">
              ${item.name}
            </button>
          `,
            )
            .join("")}
        </div>
      </nav>
    `
      : "";

  const relatedProductsHtml =
    relatedProducts.length > 0
      ? `
      <div class="mt-8">
        <h2 class="text-lg font-bold text-gray-900 mb-4">관련 상품</h2>
        <div class="grid grid-cols-2 gap-4">
          ${relatedProducts.map((p) => renderProductCard(p)).join("")}
        </div>
      </div>
    `
      : "";

  return `
    <div class="min-h-screen bg-gray-50 p-4">
      ${breadcrumb}
      <!-- 상품 상세 정보 -->
      <div class="bg-white rounded-lg shadow-sm mb-6">
        <div class="p-4">
          <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img src="${image}" alt="${title}" class="w-full h-full object-cover product-detail-image">
          </div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">${title}</h1>
          <p class="text-gray-600 mb-2">${brand}</p>
          <p class="text-2xl font-bold text-gray-900 mb-4">${price.toLocaleString()}원</p>
          <button class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors add-to-cart-btn" data-product-id="${productId}">
            장바구니 담기
          </button>
        </div>
      </div>
      ${relatedProductsHtml}
    </div>
  `;
}

/**
 * 서버 사이드 렌더링 함수
 */
export const render = async (url: string, query: Record<string, string> = {}) => {
  try {
    // baseUrl 설정 (프로덕션/개발 환경에 따라)
    const baseUrl = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/react/" : "/";

    // 라우트 매칭
    const route = matchRoute(url, baseUrl);

    // 스토어 초기화 (매 요청마다 새로 생성)
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { ...initialProductState },
    });

    let pageHtml = "";
    let title = "쇼핑몰";

    // 라우트에 따라 데이터 프리페칭
    if (route.handler === "HomePage") {
      // 홈페이지: 상품 목록과 카테고리 로드
      const prefetchData = prefetchHomePageData(query, itemsData);

      // categories가 올바른 형태인지 확인 (빈 객체 {} 형태여야 함)
      const correctCategories = getUniqueCategories(itemsData);

      // 스토어에 디스패치
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: prefetchData.products,
          categories: correctCategories,
          totalCount: prefetchData.totalCount,
          loading: false,
          status: "done",
        },
      });

      const state = productStore.getState();
      const { products, totalCount } = state;
      const searchQuery = query.search || "";
      const limit = Number(query.limit || "20");
      const sort = query.sort || "price_asc";
      const category = { category1: query.category1 || "", category2: query.category2 || "" };

      // HTML 생성 (categories는 올바른 형태로 직접 전달)
      pageHtml = renderPageWrapper({
        headerLeft: `
          <h1 class="text-xl font-bold text-gray-900">
            <a href="/" data-link>쇼핑몰</a>
          </h1>
        `.trim(),
        children: `
          ${renderSearchBar({ searchQuery, limit, sort, category, categories: correctCategories })}
          <div class="mb-6">
            ${renderProductList({ products, loading: false, error: null, totalCount })}
          </div>
        `.trim(),
      });

      title = "쇼핑몰 - 홈";
    } else if (route.handler === "ProductDetailPage") {
      // 상품 상세 페이지: 상품 상세 정보 로드
      const productId = route.params.id;
      const product = itemsData.find((item) => item.productId === productId);

      if (product) {
        // 서버 API 미들웨어와 동일한 상세 정보 구성
        const detailProduct: Product = {
          ...product,
        };

        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: detailProduct,
        });

        // 관련 상품 로드 (같은 category2 기준)
        let relatedProducts: Product[] = [];
        if (detailProduct.category2) {
          const filteredRelated = filterProducts(itemsData, {
            category2: detailProduct.category2,
            limit: "20",
            page: "1",
          });
          relatedProducts = filteredRelated.filter((p) => p.productId !== productId).slice(0, 20);
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: relatedProducts,
          });
        }

        // HTML 생성
        pageHtml = renderPageWrapper({
          headerLeft: `
            <div class="flex items-center space-x-3">
              <button onclick="window.history.back()" 
                      class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
            </div>
          `.trim(),
          children: renderProductDetail(detailProduct, relatedProducts),
        });

        title = `${detailProduct.title} - 쇼핑몰`;
      } else {
        // 상품을 찾을 수 없음
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_ERROR,
          payload: "상품을 찾을 수 없습니다.",
        });

        pageHtml = renderPageWrapper({
          headerLeft: `
            <div class="flex items-center space-x-3">
              <button onclick="window.history.back()" 
                      class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
            </div>
          `.trim(),
          children: `
            <div class="text-center my-4 py-20 shadow-md p-6 bg-white rounded-lg">
              <p class="text-lg font-medium text-gray-900 mb-2">상품을 찾을 수 없습니다</p>
              <a href="/" data-link class="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                홈으로
              </a>
            </div>
          `.trim(),
        });
        title = "상품을 찾을 수 없습니다 - 쇼핑몰";
      }
    } else {
      // 404 페이지
      pageHtml = renderPageWrapper({
        headerLeft: `
          <h1 class="text-xl font-bold text-gray-900">
            <a href="/" data-link>쇼핑몰</a>
          </h1>
        `.trim(),
        children: `
          <div class="text-center my-4 py-20 shadow-md p-6 bg-white rounded-lg">
            <p class="text-lg font-medium text-gray-900 mb-2">페이지를 찾을 수 없습니다</p>
            <a href="/" data-link class="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              홈으로
            </a>
          </div>
        `.trim(),
      });
      title = "페이지를 찾을 수 없습니다 - 쇼핑몰";
    }

    // 초기 상태 추출
    const finalState = productStore.getState();

    // categories는 항상 올바른 형태로 재생성 (productStore에서 가져오면 문자열로 변환될 수 있음)
    const finalCategories = getUniqueCategories(itemsData);

    const initialState = {
      // Playwright 테스트를 위한 top-level 필드
      products: finalState.products,
      categories: finalCategories,
      totalCount: finalState.totalCount,
      // 클라이언트 hydration을 위한 nested 구조
      productStore: {
        products: finalState.products,
        categories: finalCategories,
        totalCount: finalState.totalCount,
        currentProduct: finalState.currentProduct,
        relatedProducts: finalState.relatedProducts,
        loading: finalState.loading,
        error: finalState.error,
        status: finalState.status,
      },
      cartStore: {
        items: [],
        totalPrice: 0,
      },
    };

    return {
      html: pageHtml,
      initialState,
      title,
    };
  } catch (error) {
    console.error("SSR 렌더링 오류:", error);
    const errorHtml = renderPageWrapper({
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `<div class="p-4">서버 오류가 발생했습니다.</div>`,
    });
    return {
      html: errorHtml,
      initialState: {
        productStore: { ...initialProductState, error: "서버 오류가 발생했습니다." },
        cartStore: { items: [], totalPrice: 0 },
      },
      title: "오류 - 쇼핑몰",
    };
  }
};
