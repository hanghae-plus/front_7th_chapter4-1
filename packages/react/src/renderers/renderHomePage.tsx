import { renderToString } from "react-dom/server";
import { ServerPageWrapper } from "./ServerPageWrapper";
import type { Product, Categories } from "../entities";

interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string;
    category1: string;
    category2: string;
    sort: string;
  };
}

/**
 * 홈페이지 SSR 렌더러
 */
export function renderHomePage(data: HomePageData) {
  const { products, categories, filters, pagination } = data;

  const headerLeft = (
    <h1 className="text-xl font-bold text-gray-900">
      <a href="/" data-link="/">
        쇼핑몰
      </a>
    </h1>
  );

  const categoryList = Object.keys(categories);

  const html = renderToString(
    <ServerPageWrapper headerLeft={headerLeft}>
      {/* 검색 및 필터 영역 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        {/* 검색창 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              id="search-input"
              placeholder="상품명을 검색해보세요..."
              defaultValue={filters.search}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/search-icon.svg" alt="검색" className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* 필터 옵션 */}
        <div className="space-y-3">
          {/* 카테고리 필터 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">카테고리:</label>
              <button className="text-xs hover:text-blue-800 hover:underline">전체</button>
              {filters.category1 && (
                <>
                  <span className="text-xs text-gray-500">&gt;</span>
                  <button className="text-xs hover:text-blue-800 hover:underline">{filters.category1}</button>
                </>
              )}
              {filters.category2 && (
                <>
                  <span className="text-xs text-gray-500">&gt;</span>
                  <span className="text-xs text-gray-600 cursor-default">{filters.category2}</span>
                </>
              )}
            </div>

            {/* 1depth 카테고리 */}
            {!filters.category1 && categoryList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categoryList.map((categoryKey) => (
                  <button
                    key={categoryKey}
                    data-category1={categoryKey}
                    className="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                               bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {categoryKey}
                  </button>
                ))}
              </div>
            )}

            {/* 2depth 카테고리 */}
            {filters.category1 && categories[filters.category1] && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(categories[filters.category1]).map((category2) => {
                    const isSelected = filters.category2 === category2;
                    return (
                      <button
                        key={category2}
                        data-category1={filters.category1}
                        data-category2={category2}
                        className={`category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                               ${
                                 isSelected
                                   ? "bg-blue-100 border-blue-300 text-blue-800"
                                   : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                               }`}
                      >
                        {category2}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 기존 필터들 */}
          <div className="flex gap-2 items-center justify-between">
            {/* 페이지당 상품 수 */}
            <div className="flex items-center gap-2">
              <label htmlFor="limit-select" className="text-sm text-gray-600">
                개수:
              </label>
              <select
                id="limit-select"
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={pagination.limit}
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>

            {/* 정렬 */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-600">
                정렬:
              </label>
              <select
                id="sort-select"
                className="text-sm border border-gray-300 rounded px-2 py-1
                           focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={filters.sort}
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
        {/* 상품 개수 정보 */}
        {pagination.total > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            총 <span className="font-medium text-gray-900">{pagination.total.toLocaleString()}개</span>의 상품
          </div>
        )}

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 gap-4 mb-6" id="products-grid">
          {products.map((product) => (
            <div
              key={product.productId}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card"
              data-product-id={product.productId}
            >
              {/* 상품 이미지 */}
              <div className="aspect-square bg-gray-100 overflow-hidden cursor-pointer product-image">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>

              {/* 상품 정보 */}
              <div className="p-3">
                <div className="cursor-pointer product-info mb-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                  <p className="text-lg font-bold text-gray-900">{Number(product.lprice).toLocaleString()}원</p>
                </div>

                {/* 장바구니 버튼 */}
                <button
                  className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md
                               hover:bg-blue-700 transition-colors add-to-cart-btn"
                  data-product-id={product.productId}
                >
                  장바구니 담기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ServerPageWrapper>,
  );

  return {
    head: `<title>쇼핑몰 - 홈</title>`,
    html,
  };
}
