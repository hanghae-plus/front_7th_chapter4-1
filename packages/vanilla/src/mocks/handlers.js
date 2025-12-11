import { http, HttpResponse } from "msw";
import { delay, getProduct, getProducts, getUniqueCategories } from "./mockUtils";

export const handlers = [
  // 상품 목록 API
  http.get("/api/products", async ({ request }) => {
    const url = new URL(request.url);
    const query = Object.fromEntries([...url.searchParams]);
    const response = getProducts(query);
    await delay();
    return HttpResponse.json(response);
  }),

  // 상품 상세 API
  http.get("/api/products/:id", ({ params }) => {
    const { id } = params;
    const product = getProduct(id);

    return !product ? HttpResponse.json({ error: "Product not found" }, { status: 404 }) : HttpResponse.json(product);
  }),

  // 카테고리 목록 API
  http.get("/api/categories", async () => {
    const categories = getUniqueCategories();
    await delay();
    return HttpResponse.json(categories);
  }),
];
