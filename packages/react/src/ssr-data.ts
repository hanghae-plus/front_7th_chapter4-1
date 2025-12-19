import type { Categories, Product } from "./entities/products/types";
import type { StringRecord } from "./types";
import items from "./mocks/items.json";

export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
  query?: StringRecord;
}

export interface ProductDetailData {
  currentProduct: Product | null;
  relatedProducts: Product[];
}

export type InitialData = HomePageData | ProductDetailData | null;

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

function filterProducts(products: Product[], query: StringRecord): Product[] {
  let filtered = [...products];

  // query 파라미터는 'query' 또는 'search' 둘 다 지원
  const searchQuery = query.query || query.search;
  if (searchQuery) {
    const searchTerm = searchQuery.toLowerCase();
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

  const sort = query.sort || "price_asc";
  switch (sort) {
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
  }

  return filtered;
}

export async function loadHomePageData(query: StringRecord = {}): Promise<HomePageData> {
  const page = parseInt(query.current ?? query.page ?? "1");
  const limit = parseInt(query.limit ?? "20");

  const filteredProducts = filterProducts(items as Product[], query);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const categories = getUniqueCategories();

  return {
    products: paginatedProducts,
    categories,
    totalCount: filteredProducts.length,
    query,
  };
}

export async function loadProductDetailData(productId: string): Promise<ProductDetailData> {
  const product = (items as Product[]).find((item) => item.productId === productId);

  if (!product) {
    return {
      currentProduct: null,
      relatedProducts: [],
    };
  }

  const relatedProducts = (items as Product[])
    .filter((item) => item.category2 === product.category2 && item.productId !== productId)
    .slice(0, 20);

  return {
    currentProduct: product,
    relatedProducts,
  };
}
