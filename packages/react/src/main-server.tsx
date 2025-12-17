import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { router } from "./router";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities/products/productStore";
import { cartStore, CART_ACTIONS } from "./entities/carts/cartStore";
import mockProducts from "./mocks/items.json";
import type { Product } from "./entities/products/types";

// 라우트 등록 (모듈 레벨에서 한 번만 실행)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

/**
 * 서버용 데이터 fetcher
 * fetch API 대신 목 데이터를 직접 사용
 */
const serverFetch = {
  /**
   * 상품 목록 조회
   */
  async getProducts(params: Record<string, string> = {}) {
    const { limit = "20", search = "", category1 = "", category2 = "", sort = "price_asc" } = params;

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
  async getProduct(productId: string) {
    return mockProducts.find((p) => p.productId === productId) || null;
  },

  /**
   * 관련 상품 조회
   */
  async getRelatedProducts(product: Product | null) {
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
    const categories: Record<string, Record<string, Record<string, never>>> = {};

    mockProducts.forEach((product) => {
      if (product.category1) {
        if (!categories[product.category1]) {
          categories[product.category1] = {};
        }
        if (product.category2) {
          categories[product.category1][product.category2] = {};
        }
      }
    });

    return categories;
  },
};

/**
 * 서버 사이드 렌더링 함수
 * @param url - 요청 URL
 * @param query - 쿼리 파라미터
 * @returns 렌더링된 HTML과 초기 상태
 */
export const render = async (url: string, query: Record<string, string> = {}) => {
  // 1. Store 리셋 (매 요청마다 깨끗한 상태)
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialProductState,
  });
  cartStore.dispatch({
    type: CART_ACTIONS.CLEAR_CART,
    payload: undefined,
  });

  // 2. ServerRouter로 URL 매칭
  const route = router.match(url, query);

  if (!route) {
    const html = renderToString(createElement(NotFoundPage));
    return {
      html,
      state: {
        product: productStore.getState(),
        cart: cartStore.getState(),
        route: { url, query, params: {} },
      },
      meta: {
        title: "404 - 페이지를 찾을 수 없습니다",
        description: "요청하신 페이지를 찾을 수 없습니다.",
      },
    };
  }

  // 3. 라우트별 데이터 프리페칭
  try {
    if (route.path === "/") {
      // Homepage: products + categories
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
      // Product detail: product + related products
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
    console.error("SSR data prefetching error:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error instanceof Error ? error.message : "데이터 로드 중 오류가 발생했습니다.",
    });
  }

  // 4. React 컴포넌트 렌더링
  const PageComponent = route.handler;
  const html = renderToString(createElement(PageComponent));

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

  // 6. HTML과 state 반환
  const productState = productStore.getState();
  const cartState = cartStore.getState();

  return {
    html,
    state: {
      products: productState.products,
      categories: productState.categories,
      totalCount: productState.totalCount,
      product: productState,
      cart: cartState,
      route: { url, query, params: route.params },
    },
    meta,
  };
};
