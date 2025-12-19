import { http, HttpResponse } from "msw";
import { enhanceProductDetail, filterProducts, getUniqueCategories, paginateProducts } from "../api/productUtils.ts";
import items from "./items.json" with { type: "json" };

const delay = async () => await new Promise((resolve) => setTimeout(resolve, 200));

export const handlers = [
  // 상품 목록 API
  http.get("/api/products", async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? url.searchParams.get("current") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "20");
    const search = url.searchParams.get("search") || "";
    const category1 = url.searchParams.get("category1") || "";
    const category2 = url.searchParams.get("category2") || "";
    const sort = url.searchParams.get("sort") || "price_asc";

    // 필터링된 상품들
    const filteredProducts = filterProducts(items, {
      search,
      category1,
      category2,
      sort,
    });

    // 페이지네이션
    const { products, pagination } = paginateProducts(filteredProducts, page, limit);

    // 응답 데이터
    const response = {
      products,
      pagination,
      filters: {
        search,
        category1,
        category2,
        sort,
      },
    };

    await delay();

    return HttpResponse.json(response);
  }),

  // 상품 상세 API
  http.get("/api/products/:id", ({ params }) => {
    const { id } = params;
    const product = items.find((item) => item.productId === id);

    if (!product) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 상세 정보에 추가 데이터 포함
    const detailProduct = enhanceProductDetail(product);

    return HttpResponse.json(detailProduct);
  }),

  // 카테고리 목록 API
  http.get("/api/categories", async () => {
    const categories = getUniqueCategories(items);
    await delay();
    return HttpResponse.json(categories);
  }),
];
