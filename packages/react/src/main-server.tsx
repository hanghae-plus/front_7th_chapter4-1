import { renderToString } from "react-dom/server";
import React, { createElement } from "react";
import items from "./mocks/items.json";
import { initialProductState } from "./entities/products/productStore";
import { ProductStoreContext } from "./entities/products/ProductStoreContext";
import { ModalProvider, ToastProvider } from "./components";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import type { Product } from "./entities/products/types";
import type { Categories } from "./entities/products/types";

function getUniqueCategories(): Categories {
  const categories: Categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

function filterProducts(products: Product[], query: Record<string, string>) {
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

// 라우트 매칭 함수
function matchRoute(url: string): { path: string; params: Record<string, string> } | null {
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;

  // 홈페이지
  if (pathname === "/" || pathname === "") {
    return { path: "/", params: {} };
  }

  // 상품 상세 페이지: /product/:id/
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return { path: "/product/:id/", params: { id: productMatch[1] } };
  }

  // 404
  return null;
}

// prefetchData: store 없이 데이터만 반환
async function prefetchData(
  route: { path: string; params: Record<string, string> },
  url: string,
): Promise<typeof initialProductState> {
  if (route.path === "/") {
    // 홈페이지: 상품 목록 + 카테고리
    const urlObj = new URL(url, "http://localhost");
    const query = Object.fromEntries(urlObj.searchParams);

    const page = parseInt(query.page || query.current || "1");
    const limit = parseInt(query.limit || "20");
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

    // store 없이 데이터만 반환
    return {
      products: paginatedProducts,
      categories,
      totalCount: filteredProducts.length,
      loading: false,
      status: "done",
      currentProduct: null,
      relatedProducts: [],
      error: null,
    };
  } else if (route.path === "/product/:id/") {
    // 상품 상세 페이지
    const product = items.find((item) => String(item.productId) === route.params.id);

    if (!product) {
      throw new Error("Product not found");
    }

    // 관련 상품 찾기
    const relatedProducts = items
      .filter(
        (item) =>
          String(item.productId) !== String(product.productId) &&
          item.category1 === product.category1 &&
          item.category2 === product.category2,
      )
      .slice(0, 20);

    const fallbackRelatedProducts =
      relatedProducts.length === 0
        ? items
            .filter(
              (item) => String(item.productId) !== String(product.productId) && item.category1 === product.category1,
            )
            .slice(0, 20)
        : relatedProducts;

    // 상세 정보 추가
    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    // store 없이 데이터만 반환
    return {
      products: [],
      totalCount: 0,
      categories: {},
      loading: false,
      status: "done",
      currentProduct: detailProduct,
      relatedProducts: fallbackRelatedProducts,
      error: null,
    };
  }

  // 기본값
  return initialProductState;
}

export const render = async (url: string) => {
  // 1. 라우트 매칭
  const matchedRoute = matchRoute(url);

  // 2. 404 처리
  if (!matchedRoute) {
    return {
      head: "<title>404 | 쇼핑몰</title>",
      html: renderToString(createElement(NotFoundPage)),
      state: null,
    };
  }

  // 3. 데이터만 준비 (store 없이!)
  const initialData = await prefetchData(matchedRoute, url);

  // 4. Context Provider로 데이터 주입하여 컴포넌트 렌더링
  // 서버에서는 라우트 매칭 결과로 페이지 컴포넌트를 직접 렌더링
  let html: string;
  let head: string;

  // Context Provider와 Provider들로 감싸는 헬퍼 함수
  const wrapWithProviders = (PageComponent: React.ComponentType<Record<string, never>>) =>
    createElement(
      ProductStoreContext.Provider,
      { value: initialData },
      createElement(ToastProvider, null, createElement(ModalProvider, null, createElement(PageComponent))),
    );

  if (matchedRoute.path === "/") {
    html = renderToString(wrapWithProviders(HomePage));
    head = "<title>쇼핑몰 - 홈</title>";
  } else if (matchedRoute.path === "/product/:id/") {
    html = renderToString(wrapWithProviders(ProductDetailPage));
    const product = initialData.currentProduct;
    if (product) {
      head = `<title>${product.title} - 쇼핑몰</title>`;
    } else {
      head = `<title>상품 ${matchedRoute.params.id} 상세 | 쇼핑몰</title>`;
    }
  } else {
    html = renderToString(wrapWithProviders(NotFoundPage));
    head = "<title>404 | 쇼핑몰</title>";
  }

  // 5. 초기 데이터 반환 (store 상태가 아닌 순수 데이터)
  return { html, head, state: { productStore: initialData } };
};
