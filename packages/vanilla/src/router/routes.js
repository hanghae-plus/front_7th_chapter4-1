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
      // 테스트와 동일한 순서로 반환: products, categories, totalCount
      return {
        products: productsData.products,
        categories,
        totalCount: productsData.pagination.total,
        loading: false,
        error: null,
        // SSR 쿼리 파라미터 전달
        query,
      };
    },
  },
  {
    path: "/product/:id/",
    component: ProductDetailPage,
    // title은 getServerSideProps에서 동적으로 설정
    getServerSideProps: async ({ params }) => {
      const product = await getProduct(params.id);
      // 관련 상품 가져오기 (같은 카테고리)
      let relatedProducts = [];
      if (product?.category1 && product?.category2) {
        const relatedData = await getProducts({
          category1: product.category1,
          category2: product.category2,
          limit: 20,
        });
        relatedProducts = relatedData.products.filter((p) => p.productId !== product.productId);
      }
      return {
        product,
        relatedProducts,
        title: product?.title ? `${product.title} - 쇼핑몰` : "상품 상세 - 쇼핑몰",
      };
    },
  },
];
