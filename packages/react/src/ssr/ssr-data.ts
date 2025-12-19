import { getProducts, getProduct, getCategories } from "../api/productApi";
import type { Product, Categories } from "../entities";

export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

export interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
}

/**
 * 홈페이지 데이터 로더
 * @param query - URL 쿼리 파라미터
 */
export async function loadHomePageData(query: Record<string, string>): Promise<HomePageData> {
  const [productsResponse, categories] = await Promise.all([
    getProducts({
      page: query.page || "1",
      limit: query.limit || "20",
      search: query.search || "",
      category1: query.category1 || "",
      category2: query.category2 || "",
      sort: query.sort || "price_asc",
    }),
    getCategories(),
  ]);

  return {
    products: productsResponse.products,
    categories,
    totalCount: productsResponse.pagination.total,
  };
}

/**
 * 상품 상세 페이지 데이터 로더
 * @param productId - 상품 ID
 */
export async function loadProductDetailData(productId: string): Promise<ProductDetailData> {
  const product = await getProduct(productId);

  // 관련 상품 로드 (같은 category2 기준)
  let relatedProducts: Product[] = [];
  if (product.category2) {
    try {
      const response = await getProducts({
        category2: product.category2,
        limit: "20",
        page: "1",
      });
      // 현재 상품 제외
      relatedProducts = response.products.filter((p) => p.productId !== productId);
    } catch (error) {
      console.error("관련 상품 로드 실패:", error);
      // 관련 상품 로드 실패는 무시
    }
  }

  return {
    product,
    relatedProducts,
  };
}
