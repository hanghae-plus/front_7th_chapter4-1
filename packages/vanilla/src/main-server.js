import { router } from "./router/router.js";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages/index.js";
import { productStore } from "./stores/productStore.js";
import { cartStore } from "./stores/cartStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import mockProducts from "./mocks/items.json";

/**
 * 서버용 데이터 fetcher
 * fetch API 대신 목 데이터를 직접 사용
 */
const serverFetch = {
  /**
   * 상품 목록 조회
   */
  async getProducts(params = {}) {
    const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;

    // 목 데이터 필터링
    let filtered = [...mockProducts];

    // 검색 필터
    if (search) {
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    }

    // 카테고리 필터
    if (category1) {
      filtered = filtered.filter((p) => p.category1 === category1);
    }
    if (category2) {
      filtered = filtered.filter((p) => p.category2 === category2);
    }

    // 정렬
    if (sort === "price_asc") {
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
    }

    return {
      products: filtered.slice(0, parseInt(limit)),
      totalCount: filtered.length,
    };
  },

  /**
   * 상품 상세 조회
   */
  async getProduct(productId) {
    return mockProducts.find((p) => p.productId === productId) || null;
  },

  /**
   * 관련 상품 조회
   */
  async getRelatedProducts(product) {
    if (!product) return [];

    // 같은 카테고리의 다른 상품들
    return mockProducts
      .filter(
        (p) =>
          p.productId !== product.productId && (p.category1 === product.category1 || p.category2 === product.category2),
      )
      .slice(0, 20);
  },

  /**
   * 카테고리 목록 조회
   */
  async getCategories() {
    const categories = {};

    mockProducts.forEach((product) => {
      if (product.category1) {
        if (!categories[product.category1]) {
          categories[product.category1] = new Set();
        }
        if (product.category2) {
          categories[product.category1].add(product.category2);
        }
      }
    });

    // Set을 중첩 객체로 변환 (테스트 호환성)
    Object.keys(categories).forEach((key) => {
      const categoryArray = Array.from(categories[key]);
      categories[key] = categoryArray.reduce((acc, cat) => {
        acc[cat] = {};
        return acc;
      }, {});
    });

    return categories;
  },
};

// 라우트 등록 (모듈 레벨에서 한 번만 실행)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

/**
 * 서버 사이드 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 쿼리 파라미터
 * @returns {Promise<{html: string, state: Object}>}
 */
export const render = async (url, query = {}) => {
  // 0. Store 초기화 (매 요청마다 깨끗한 상태로 시작)
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: [],
      totalCount: 0,
      currentProduct: null,
      relatedProducts: [],
      loading: true,
      error: null,
      status: "idle",
      categories: {},
    },
  });
  cartStore.dispatch({
    type: "RESET",
    payload: { items: [] },
  });

  // 1. URL 매칭 (query도 함께 전달)
  const route = router.match(url, query);

  if (!route) {
    // 매칭되는 라우트가 없으면 NotFound (이 경우는 발생하지 않아야 함)
    const html = NotFoundPage();
    return {
      html,
      state: {
        product: productStore.getState(),
        cart: cartStore.getState(),
        route: { url, query, params: {} },
      },
    };
  }

  // 3. 라우트별 데이터 프리페칭 및 Store 초기화
  try {
    if (route.path === "/") {
      // 홈 페이지: 상품 목록 및 카테고리 로드
      const [productsData, categories] = await Promise.all([
        serverFetch.getProducts(query),
        serverFetch.getCategories(),
      ]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_PRODUCTS,
        payload: productsData,
      });
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CATEGORIES,
        payload: categories,
      });
    } else if (route.path === "/product/:id/") {
      // 상품 상세 페이지: 상품 상세 및 관련 상품 로드
      const product = await serverFetch.getProduct(route.params.id);

      if (product) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: product,
        });

        const relatedProducts = await serverFetch.getRelatedProducts(product);
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: relatedProducts,
        });
      } else {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_ERROR,
          payload: "상품을 찾을 수 없습니다.",
        });
      }
    }
  } catch (error) {
    console.error("SSR 데이터 프리페칭 오류:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
  }

  // 4. 페이지 컴포넌트 렌더링
  const PageComponent = route.handler;
  const html = PageComponent();

  // 5. 메타 정보 생성
  let meta = {
    title: "쇼핑몰 - 홈",
    description: "항해플러스 프론트엔드 쇼핑몰",
  };

  if (route.path === "/product/:id/") {
    const product = productStore.getState().currentProduct;
    if (product) {
      meta = {
        title: `${product.title} - 쇼핑몰`,
        description: product.title,
      };
    }
  }

  // 6. 현재 상태 반환
  const productState = productStore.getState();
  const cartState = cartStore.getState();

  return {
    html,
    state: {
      // 테스트 호환성을 위한 평면 구조
      products: productState.products,
      categories: productState.categories,
      totalCount: productState.totalCount,
      // 추가 데이터는 중첩 구조로 유지
      product: productState,
      cart: cartState,
      route: { url, query, params: route.params },
    },
    meta,
  };
};
