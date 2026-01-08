/* eslint-disable react-refresh/only-export-components */
// 서버 전용 렌더링 파일이므로 Fast Refresh 경고 무시
import { renderToString } from "react-dom/server";
import { createElement, Fragment } from "react";
// entities 전체를 import하면 router가 로드되어 window 에러 발생
// 필요한 것만 직접 import (규칙 준수: 기본 구현 코드 수정 금지)
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities/products/productStore";
import { loadHomePageData, loadProductDetailData } from "./ssr-data";
import type { StringRecord } from "./types";
import { Footer } from "./components";
import type { Product } from "./entities/products/types";

// 서버 전용: PublicImage 대신 직접 img 태그 사용 (BASE_URL이 import.meta.env 사용)
// 규칙 준수: 기본 구현 컴포넌트(PublicImage) 수정 금지
const ServerImage = ({ src, alt, ...props }: { src: string; alt: string; className?: string }) => {
  // 서버에서는 상대 경로 사용 (빌드된 HTML에서는 상대 경로로 해석됨)
  const imageSrc = src.startsWith("/") ? src : `/${src}`;
  return <img src={imageSrc} alt={alt} {...props} />;
};

// 서버용 라우트 매칭 함수
interface RouteMatch {
  type: "home" | "product" | "notFound";
  params: StringRecord;
  path: string;
}

function matchRoute(url: string): RouteMatch | null {
  // 쿼리 문자열 제거
  const pathname = url.split("?")[0];

  // 홈 페이지
  if (pathname === "/" || pathname === "") {
    return {
      type: "home",
      params: {},
      path: "/",
    };
  }

  // 상품 상세 페이지: /product/:id/
  const productMatch = pathname.match(/^\/product\/(\d+)\/?$/);
  if (productMatch) {
    return {
      type: "product",
      params: { id: productMatch[1] },
      path: "/product/:id/",
    };
  }

  // 404
  return {
    type: "notFound",
    params: {},
    path: "404",
  };
}

// 서버 전용: PageWrapper 없이 렌더링하는 페이지 컴포넌트
// 기본 구현 컴포넌트(SearchBar, ProductList)는 Hooks를 사용하므로,
// 서버에서는 직접 store 데이터를 읽어서 HTML 구조를 직접 렌더링
function ServerHomePage({ query }: { query: StringRecord }) {
  const state = productStore.getState();
  const { products, categories, totalCount, loading, error } = state;

  // 검색 쿼리 파라미터에서 값 추출
  const searchQuery = query.search || "";
  const limit = query.limit || "20";
  const sort = query.sort || "price_asc";
  const category1 = query.category1 || "";
  const category2 = query.category2 || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              <a href="/" data-link="/">
                쇼핑몰
              </a>
            </h1>
            <div className="flex items-center space-x-2">
              <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <ServerImage src="/cart-header-icon.svg" alt="장바구니" className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                id="search-input"
                placeholder="상품명을 검색해보세요..."
                defaultValue={searchQuery}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ServerImage src="/search-icon.svg" alt="검색" className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {/* 카테고리 필터 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">카테고리:</label>
                {["전체", category1, category2]
                  .filter((cat, index) => index === 0 || Boolean(cat))
                  .map((cat, index) => {
                    if (cat === "전체") {
                      return (
                        <button
                          key="reset"
                          data-breadcrumb="reset"
                          className="text-xs hover:text-blue-800 hover:underline"
                        >
                          전체
                        </button>
                      );
                    } else if (index === 1) {
                      return (
                        <Fragment key={cat}>
                          <span className="text-xs text-gray-500">&gt;</span>
                          <button
                            data-breadcrumb="category1"
                            data-category1={cat}
                            className="text-xs hover:text-blue-800 hover:underline"
                          >
                            {cat}
                          </button>
                        </Fragment>
                      );
                    } else if (index === 2) {
                      return (
                        <Fragment key={cat}>
                          <span className="text-xs text-gray-500">&gt;</span>
                          <span className="text-xs text-gray-600 cursor-default">{cat}</span>
                        </Fragment>
                      );
                    }
                    return null;
                  })}
              </div>

              {/* 1depth 카테고리 버튼들 */}
              {!category1 && (
                <div className="flex flex-wrap gap-2">
                  {Object.keys(categories).length > 0 ? (
                    Object.keys(categories).map((categoryKey) => (
                      <button
                        key={categoryKey}
                        data-category1={categoryKey}
                        className="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {categoryKey}
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">카테고리 로딩 중...</div>
                  )}
                </div>
              )}

              {/* 2depth 카테고리 버튼들 */}
              {category1 && categories[category1] && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(categories[category1]).map((category2Key) => {
                      const isSelected = category2 === category2Key;
                      return (
                        <button
                          key={category2Key}
                          data-category1={category1}
                          data-category2={category2Key}
                          className={`category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                            isSelected
                              ? "bg-blue-100 border-blue-300 text-blue-800"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {category2Key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 페이지당 상품 수 및 정렬 */}
            <div className="flex gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">개수:</label>
                <select
                  id="limit-select"
                  defaultValue={limit}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10">10개</option>
                  <option value="20">20개</option>
                  <option value="50">50개</option>
                  <option value="100">100개</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">정렬:</label>
                <select
                  id="sort-select"
                  defaultValue={sort}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="price_asc">가격 낮은순</option>
                  <option value="price_desc">가격 높은순</option>
                  <option value="name_asc">이름순</option>
                  <option value="name_desc">이름 역순</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="mb-6">
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <ServerImage src="/error-large-icon.svg" alt="오류" className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ServerImage src="/search-large-icon.svg" alt="검색" className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">상품을 찾을 수 없습니다</h3>
              <p className="text-gray-600">다른 검색어를 시도해보세요.</p>
            </div>
          )}

          {totalCount > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              총 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}개</span>의 상품
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6" id="products-grid">
            {products.map((product: Product) => (
              <div
                key={product.productId}
                data-product-id={product.productId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <ServerImage src={product.image} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.title}
                  </h3>
                  <p className="text-base font-bold text-blue-600">{parseInt(product.lprice).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ServerProductDetailPage(_props: { productId: string }) {
  const state = productStore.getState();
  const product = state.currentProduct;
  const relatedProducts = state.relatedProducts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <ServerImage src="/back-icon.svg" alt="뒤로" className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <ServerImage src="/cart-header-icon.svg" alt="장바구니" className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <div className="min-h-screen bg-gray-50 p-4">
          {state.loading && (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">상품 정보를 불러오는 중...</p>
              </div>
            </div>
          )}

          {state.error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <ServerImage src="/error-large-icon.svg" alt="오류" className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-4">{state.error}</p>
            </div>
          )}

          {product && (
            <>
              <div className="mb-6">
                <ServerImage src={product.image} alt={product.title} className="w-full h-auto rounded-lg mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.title}</h1>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-3xl font-bold text-blue-600">
                    {parseInt(product.lprice).toLocaleString()}원
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4">재고 {Math.floor(Math.random() * 100)}개</div>
                <p className="text-gray-700 mb-6">
                  {product.title}에 대한 상세 설명입니다. 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은
                  제품입니다.
                </p>

                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">수량</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button id="quantity-decrease" className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                      <ServerImage src="/minus-icon.svg" alt="감소" className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      id="quantity-input"
                      min="1"
                      defaultValue="1"
                      className="w-20 px-3 py-2 border border-gray-300 rounded text-center"
                    />
                    <button id="quantity-increase" className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                      <ServerImage src="/plus-icon.svg" alt="증가" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  장바구니 담기
                </button>
              </div>

              {relatedProducts.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">관련 상품</h2>
                  <p className="text-sm text-gray-600 mb-4">같은 카테고리의 다른 상품들</p>
                  <div className="grid grid-cols-2 gap-4">
                    {relatedProducts.slice(0, 10).map((relatedProduct: Product) => (
                      <div
                        key={relatedProduct.productId}
                        data-product-id={relatedProduct.productId}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          <ServerImage
                            src={relatedProduct.image}
                            alt={relatedProduct.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                            {relatedProduct.title}
                          </h3>
                          <p className="text-base font-bold text-blue-600">
                            {parseInt(relatedProduct.lprice).toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ServerNotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-900">쇼핑몰</div>
            <div className="flex items-center space-x-2">
              <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <ServerImage src="/cart-header-icon.svg" alt="장바구니" className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <div className="text-center my-4 py-20 shadow-md p-6 bg-white rounded-lg">
          <ServerImage src="/404.svg" alt="페이지를 찾을 수 없습니다" />
          <a
            href="/"
            data-link="/"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            홈으로
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * 메타 태그 생성
 */
function generateHead(route: RouteMatch | null, product?: Product): string {
  if (!route) {
    return `
      <title>쇼핑몰</title>
      <meta name="description" content="쇼핑몰에 오신 것을 환영합니다.">
    `.trim();
  }

  // 상품 상세 페이지
  if (route.path === "/product/:id/" && product) {
    return `
      <title>${product.title} - 쇼핑몰</title>
      <meta name="description" content="${product.title}에 대한 상세 정보입니다.">
      <meta property="og:title" content="${product.title}">
      <meta property="og:description" content="${product.title}에 대한 상세 정보입니다.">
      <meta property="og:image" content="${product.image}">
    `.trim();
  }

  // 홈 페이지
  if (route.path === "/") {
    return `
      <title>쇼핑몰 - 홈</title>
      <meta name="description" content="쇼핑몰에 오신 것을 환영합니다.">
    `.trim();
  }

  // 기본
  return `
    <title>쇼핑몰</title>
    <meta name="description" content="쇼핑몰에 오신 것을 환영합니다.">
  `.trim();
}

/**
 * 서버 렌더링 메인 함수
 */
export async function render(url: string, query: StringRecord = {}) {
  // 1. Store 초기화
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: true,
      status: "pending",
    },
  });

  // 2. 라우트 매칭
  const route = matchRoute(url);

  if (!route || route.type === "notFound") {
    const html = renderToString(createElement(ServerNotFoundPage));
    const head = generateHead(route);
    return {
      html,
      head,
      initialData: null,
    };
  }

  // 3. 데이터 프리페칭
  try {
    if (route.path === "/") {
      // 홈페이지: 상품 목록 + 카테고리
      const data = await loadHomePageData(url, query);
      if (data) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products: data.products,
            totalCount: data.totalCount,
            categories: data.categories,
            loading: false,
            status: "done",
          },
        });
      }
    } else if (route.path === "/product/:id/") {
      // 상품 상세: 상품 정보 + 관련 상품
      const productId = route.params.id;
      const data = await loadProductDetailData(productId);
      if (data) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: data.product,
        });
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: data.relatedProducts,
        });
      }
    }
  } catch (error) {
    console.error("데이터 프리페칭 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error instanceof Error ? error.message : "데이터를 불러오는데 실패했습니다.",
    });
  }

  // 4. React 컴포넌트 → HTML 문자열
  // 서버 환경에서는 PageWrapper 없이 서버 전용 컴포넌트를 렌더링
  // 기본 구현 컴포넌트(PageWrapper, SearchBar, ProductList 등)는 클라이언트 전용 Hooks를 사용하므로
  // 서버에서는 직접 store 데이터를 읽어서 HTML 구조를 직접 렌더링 (규칙 준수: 기본 구현 코드 수정 금지)
  let html: string;
  if (route.type === "home") {
    html = renderToString(createElement(ServerHomePage, { query }));
  } else if (route.type === "product") {
    html = renderToString(createElement(ServerProductDetailPage, { productId: route.params.id }));
  } else {
    html = renderToString(createElement(ServerNotFoundPage));
  }

  // 5. 메타 태그 생성
  const state = productStore.getState();
  const head = generateHead(route, state.currentProduct ?? undefined);

  // 6. 초기 데이터 추출 (Hydration용)
  // 테스트에서 기대하는 순서로 속성 정렬
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
