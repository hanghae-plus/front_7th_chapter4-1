import { getProduct, getProducts } from "../api/server/productApi";
import type { StringRecord } from "../types";

/**
 * 상품 상세 페이지 데이터 로더
 * SSR과 SSG에서 재사용 가능
 */
export async function productDetailLoader(query: StringRecord = {}, params: StringRecord = {}) {
  console.log("query ::", query);
  const { id: productId } = params;

  if (!productId) {
    throw new Error("상품 ID가 필요합니다.");
  }

  try {
    // 상품 상세 정보 가져오기
    const product = await getProduct(String(productId));

    // 관련 상품 가져오기 (같은 category2 기준, 실패해도 괜찮음)
    let relatedProducts = [];
    if (product.category2) {
      try {
        const relatedResponse = await getProducts({
          category2: product.category2,
          limit: 20,
          page: 1,
        });

        // 현재 상품 제외
        relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
      } catch (error) {
        console.warn("관련 상품 로드 실패:", error);
        // 관련 상품 로드 실패는 무시
      }
    }

    return {
      product,
      relatedProducts,
      productId,
    };
  } catch (error) {
    console.error("상품 상세 페이지 데이터 로드 실패:", error);
    throw error;
  }
}
