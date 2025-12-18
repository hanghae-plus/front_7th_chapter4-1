import { renderToString } from "react-dom/server";
import { ServerPageWrapper } from "./ServerPageWrapper";
import type { Product } from "../entities";

interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
  productId: string;
}

/**
 * 상품 상세 페이지 SSR 렌더러
 */
export function renderProductDetailPage(data: ProductDetailData) {
  const { product, relatedProducts } = data;

  if (!product) {
    const headerLeft = (
      <h1 className="text-xl font-bold text-gray-900">
        <a href="/" data-link="/">
          쇼핑몰
        </a>
      </h1>
    );

    const html = renderToString(
      <ServerPageWrapper headerLeft={headerLeft}>
        <div className="text-center py-8">
          <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
          <a href="/" data-link="/" className="text-blue-600 hover:underline mt-4 inline-block">
            홈으로 돌아가기
          </a>
        </div>
      </ServerPageWrapper>,
    );

    return {
      head: `<title>상품을 찾을 수 없습니다 | 쇼핑몰</title>`,
      html,
    };
  }

  const {
    title,
    image,
    lprice,
    brand,
    description = "",
    rating = 0,
    reviewCount = 0,
    stock = 100,
    category1,
    category2,
  } = product;

  const price = Number(lprice);

  const headerLeft = (
    <div className="flex items-center space-x-3">
      <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
    </div>
  );

  const html = renderToString(
    <ServerPageWrapper headerLeft={headerLeft}>
      {/* 브레드크럼 */}
      {(category1 || category2) && (
        <nav className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" data-link="/" className="hover:text-blue-600 transition-colors">
              홈
            </a>
            {category1 && (
              <>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{category1}</span>
              </>
            )}
            {category2 && (
              <>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{category2}</span>
              </>
            )}
          </div>
        </nav>
      )}

      {/* 상품 상세 정보 */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        {/* 상품 이미지 */}
        <div className="p-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>

          {/* 상품 정보 */}
          <div>
            <p className="text-sm text-gray-600 mb-1">{brand}</p>
            <h1 className="text-xl font-bold text-gray-900 mb-3">{title}</h1>

            {/* 평점 및 리뷰 */}
            {rating > 0 && (
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {rating}.0 ({reviewCount.toLocaleString()}개 리뷰)
                </span>
              </div>
            )}

            {/* 가격 */}
            <div className="mb-4">
              <span className="text-2xl font-bold text-blue-600">{price.toLocaleString()}원</span>
            </div>

            {/* 재고 */}
            <div className="text-sm text-gray-600 mb-4">재고 {stock.toLocaleString()}개</div>

            {/* 설명 */}
            {description && <div className="text-sm text-gray-700 leading-relaxed mb-6">{description}</div>}
          </div>
        </div>

        {/* 수량 선택 및 액션 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-900">수량</span>
            <div className="flex items-center">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                defaultValue={1}
                min={1}
                max={stock}
                className="w-16 h-8 text-center text-sm border-t border-b border-gray-300"
              />
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium">
            장바구니 담기
          </button>
        </div>
      </div>

      {/* 상품 목록으로 돌아가기 */}
      <div className="mb-6">
        <button className="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors">
          상품 목록으로 돌아가기
        </button>
      </div>

      {/* 관련 상품 */}
      {relatedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">관련 상품</h2>
            <p className="text-sm text-gray-600">같은 카테고리의 다른 상품들</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.slice(0, 20).map((relatedProduct) => (
                <a
                  key={relatedProduct.productId}
                  href={`/products/${relatedProduct.productId}/`}
                  data-link={`/products/${relatedProduct.productId}/`}
                  className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-white rounded-md overflow-hidden mb-2">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{relatedProduct.title}</h3>
                  <p className="text-sm font-bold text-blue-600">{Number(relatedProduct.lprice).toLocaleString()}원</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </ServerPageWrapper>,
  );

  return {
    head: `<title>${title} - 쇼핑몰</title>`,
    html,
  };
}
