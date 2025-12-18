import { productStore, PRODUCT_ACTIONS, initialProductState } from "./stores";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
// import { PageWrapper } from "./pages/PageWrapper";
import items from "./mocks/items.json";
import { setServerQuery, clearServerQuery } from "./lib/serverQueryContext.js";

/**
 * 서버용 라우터 클래스
 * 클라이언트 Router와 유사하지만 window API 없이 동작
 */
class ServerRouter {
  #routes = [];

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id/")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    const paramNames = [];
    // :id → (\d+) 정규식 변환
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "(\\d+)"; // 숫자만 매칭
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.push({
      path,
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * URL에 맞는 라우트 찾기
   * @param {string} url - 요청 URL
   * @returns {Object|null} { handler, params, path } 또는 null
   */
  findRoute(url) {
    // 쿼리 문자열 제거
    const pathname = url.split("?")[0];

    for (const route of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          handler: route.handler,
          params,
          path: route.path,
        };
      }
    }
    return null;
  }
}

// 서버 라우터 인스턴스 생성
const serverRouter = new ServerRouter();

// 라우트 등록 (클라이언트와 동일한 구조)
serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);

/**
 * 카테고리 추출 함수 (handlers.js와 동일한 로직)
 */
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

/**
 * 상품 검색 및 필터링 함수 (handlers.js와 동일한 로직)
 */
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

/**
 * 서버에서 mock 데이터로 API 응답 생성
 * @param {string} path - API 경로
 * @param {Object} query - 쿼리 파라미터
 * @returns {Promise<any>} API 응답
 */
async function mockAPI(path, query = {}) {
  // 상품 목록 API
  if (path === "/api/products" || path.startsWith("/api/products?")) {
    const page = parseInt(query.page ?? query.current) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || "";
    const category1 = query.category1 || "";
    const category2 = query.category2 || "";
    const sort = query.sort || "price_asc";

    // 필터링된 상품들
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
      filters: {
        search,
        category1,
        category2,
        sort,
      },
    };
  }

  // 상품 상세 API
  if (path.startsWith("/api/products/") && !path.includes("?")) {
    const productId = path.split("/api/products/")[1];
    const product = items.find((item) => item.productId === productId);

    if (!product) {
      throw new Error("Product not found");
    }

    // 상세 정보에 추가 데이터 포함 (handlers.js와 동일)
    return {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
      reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
      stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };
  }

  // 카테고리 목록 API
  if (path === "/api/categories") {
    return getUniqueCategories();
  }

  throw new Error(`Unknown API path: ${path}`);
}

/**
 * 라우트에 따라 데이터 프리페칭
 * @param {Object} route - 라우트 정보 { handler, params, path }
 * @param {Object} query - 쿼리 파라미터
 * @returns {Promise<void>}
 */
async function prefetchData(route, query = {}) {
  // Store 초기화
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: true,
      status: "pending",
    },
  });

  try {
    if (route.path === "/") {
      // 홈페이지: 상품 목록 + 카테고리
      // 쿼리 파라미터를 사용하여 필터링/정렬 적용
      const searchParams = {
        limit: parseInt(query.limit) || 20,
        page: parseInt(query.page ?? query.current) || 1,
        sort: query.sort || "price_asc",
        search: query.search || "",
        category1: query.category1 || "",
        category2: query.category2 || "",
      };

      const [productsResponse, categories] = await Promise.all([
        mockAPI("/api/products", searchParams),
        mockAPI("/api/categories"),
      ]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsResponse.products || [],
          totalCount: productsResponse.pagination?.total || 0,
          categories: categories || {},
          loading: false,
          status: "done",
        },
      });
    } else if (route.path === "/product/:id/") {
      // 상품 상세: 상품 정보 + 관련 상품
      const productId = route.params.id;

      const product = await mockAPI(`/api/products/${productId}`);

      // 현재 상품 설정
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품 로드 (같은 category2)
      if (product.category2) {
        try {
          const relatedResponse = await mockAPI("/api/products", {
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          const relatedProducts = (relatedResponse.products || []).filter((p) => p.productId !== product.productId);

          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: relatedProducts,
          });
        } catch (error) {
          // 관련 상품 로드 실패는 조용히 처리
          console.error("관련 상품 로드 실패:", error);
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: [],
          });
        }
      }
    }
  } catch (error) {
    // 에러 처리
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message || "데이터를 불러오는데 실패했습니다.",
    });
  }
}

/**
 * 페이지 컴포넌트를 HTML 문자열로 렌더링
 * @param {Function} PageComponent - 페이지 컴포넌트 함수
 * @returns {string} HTML 문자열
 */
function renderPageComponent(PageComponent) {
  // withLifecycle으로 감싸진 컴포넌트는 직접 호출
  // 서버에서는 생명주기 없이 렌더링만 수행
  try {
    return PageComponent();
  } catch (error) {
    console.error("페이지 렌더링 실패:", error);
    return NotFoundPage();
  }
}

/**
 * 메타 태그 생성 (SEO용)
 * @param {Object} route - 라우트 정보
 * @returns {string} head 태그 내용
 */
function generateHead(route) {
  const state = productStore.getState();

  if (route.path === "/") {
    return `
      <title>쇼핑몰 - 홈</title>
      <meta name="description" content="다양한 상품을 만나보세요. 총 ${state.totalCount}개의 상품이 있습니다.">
    `.trim();
  } else if (route.path === "/product/:id/") {
    const product = state.currentProduct;
    if (product) {
      return `
        <title>${product.title} - 쇼핑몰</title>
        <meta name="description" content="${product.description || product.title}">
        <meta property="og:title" content="${product.title}">
        <meta property="og:description" content="${product.description || product.title}">
        <meta property="og:image" content="${product.image}">
      `.trim();
    }
  }

  return `
    <title>쇼핑몰</title>
    <meta name="description" content="쇼핑몰에 오신 것을 환영합니다.">
  `.trim();
}

/**
 * 서버 렌더링 메인 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 쿼리 파라미터 (선택)
 * @returns {Promise<Object>} { html, head, initialData }
 */
export async function render(url, query = {}) {
  // 1. Store 초기화
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialProductState,
  });

  // 2. 라우트 매칭
  const route = serverRouter.findRoute(url);

  if (!route) {
    // 404 페이지
    const html = renderPageComponent(NotFoundPage);
    const head = generateHead({ path: "404" });
    return {
      html,
      head,
      initialData: null,
    };
  }

  // 3. 데이터 프리페칭 (쿼리 파라미터 전달)
  await prefetchData(route, query);

  // 서버 렌더링 시 현재 쿼리 저장 (HomePage에서 사용)
  setServerQuery(query);

  // 4. 페이지 컴포넌트 렌더링
  const html = renderPageComponent(route.handler);

  // 렌더링 후 쿼리 초기화
  clearServerQuery();

  // 5. 메타 태그 생성
  const head = generateHead(route);

  // 6. 초기 데이터 추출 (Hydration용)
  // 테스트에서 기대하는 순서로 속성 정렬 (products, categories, totalCount, currentProduct, relatedProducts)
  const state = productStore.getState();
  const initialData = {
    products: state.products,
    categories: state.categories,
    totalCount: state.totalCount,
    currentProduct: state.currentProduct,
    relatedProducts: state.relatedProducts,
  };

  return {
    html,
    head,
    initialData,
  };
}
