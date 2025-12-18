import items from "./mocks/items.json";
import type { Product, Categories } from "./entities/products/types";

// 카테고리 목록
export function extractCategories(products: Product[]): Categories {
  const categories: Categories = {};

  products.forEach((product) => {
    if (!categories[product.category1]) {
      categories[product.category1] = {};
    }

    if (product.category2) {
      (categories[product.category1] as Record<string, Record<string, string>>)[product.category2] = {};
    }
  });

  return categories;
}

// 홈페이지
export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

export async function loadHomePageData(query: Record<string, string>): Promise<HomePageData> {
  const { search = "", category1 = "", category2 = "", sort = "price_asc", limit = "20" } = query;

  let filteredProducts = [...items] as Product[];

  // 검색 필터
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProducts = filteredProducts.filter((p) => p.title.toLowerCase().includes(searchLower));
  }

  // 카테고리 필터
  if (category1) {
    filteredProducts = filteredProducts.filter((p) => p.category1 === category1);
  }

  if (category2) {
    filteredProducts = filteredProducts.filter((p) => p.category2 === category2);
  }

  // 정렬
  filteredProducts.sort((a, b) => {
    const priceA = parseInt(a.lprice) || 0;
    const priceB = parseInt(b.lprice) || 0;

    if (sort === "price_asc") {
      return priceA - priceB;
    } else if (sort === "price_desc") {
      return priceB - priceA;
    }
    return 0;
  });

  const limitNum = parseInt(limit) || 20;
  const displayProducts = filteredProducts.slice(0, limitNum);

  return {
    products: displayProducts,
    categories: extractCategories(items as Product[]),
    totalCount: filteredProducts.length,
  };
}

// 상품 상세
export interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
}

export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null> {
  const product = (items as Product[]).find((p) => p.productId === productId);

  if (!product) {
    return null;
  }

  // 관련 상품
  const relatedProducts = (items as Product[])
    .filter((p) => p.productId !== productId && p.category2 === product.category2)
    .slice(0, 4);

  return {
    product,
    relatedProducts,
  };
}

export interface MetaData {
  title: string;
  description?: string;
}

// 메타데이터
export function generateMetaData(url: string, data?: HomePageData | ProductDetailData): MetaData {
  // 홈페이지
  if (url === "/" || url.includes("?")) {
    return {
      title: "쇼핑몰 - 홈",
      description: "최고의 쇼핑몰에서 다양한 상품을 만나보세요",
    };
  }

  // 상품 상세
  if (url.includes("/product/") && data && "product" in data) {
    return {
      title: `${data.product.title} - 쇼핑몰`,
      description: `${data.product.title} - ${data.product.lprice}원`,
    };
  }

  // 404
  return {
    title: "페이지를 찾을 수 없습니다 - 쇼핑몰",
  };
}

// 메타데이터를 HTML 헤드 태그로 변환
export function metaToHead(meta: MetaData): string {
  return `<title>${meta.title}</title>
${meta.description ? `<meta name="description" content="${meta.description}" />` : ""}`;
}
