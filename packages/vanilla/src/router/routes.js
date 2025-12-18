// src/router/routes.js
import { HomePage, ProductDetailPage } from "../pages";
import { getProducts, getProduct, getCategories } from "../api/productApi";

export const routes = [
  {
    path: "/",
    component: HomePage,
    title: "쇼핑몰 - 홈",
    // SSR 데이터 프리패칭
    getServerSideProps: async ({ query }) => {
      const [productsData, categories] = await Promise.all([getProducts(query), getCategories()]);
      return {
        products: productsData.products,
        totalCount: productsData.pagination.total,
        categories,
        loading: false,
        error: null,
      };
    },
  },
  {
    path: "/product/:id/",
    component: ProductDetailPage,
    // title은 getServerSideProps에서 동적으로 설정
    getServerSideProps: async ({ params }) => {
      const product = await getProduct(params.id);
      return {
        product,
        title: product?.title ? `${product.title} - 쇼핑몰` : "상품 상세 - 쇼핑몰",
      };
    },
  },
];
