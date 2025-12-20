import { useEffect, type FunctionComponent } from "react";
import {
  loadNextProducts,
  loadProductsAndCategories,
  ProductList,
  SearchBar,
  type Categories,
  type Product,
} from "../entities";
import { PageWrapper } from "./PageWrapper";
import { getCategories, getProducts } from "../api/productApi";
import type { MemoryRouterInstance } from "@hanghae-plus/lib";
import { productStore } from "../entities/products/productStore";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

// 무한 스크롤 이벤트 등록
let scrollHandlerRegistered = false;

const registerScrollHandler = () => {
  if (scrollHandlerRegistered || typeof window === "undefined") return;

  window.addEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = () => {
  if (!scrollHandlerRegistered || typeof window === "undefined") return;
  window.removeEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = false;
};

export const HomePage = ({
  serversideProps,
  serverRouter,
}: {
  serversideProps: {
    products: Product[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    categories: Categories;
  };
  serverRouter: MemoryRouterInstance<FunctionComponent>;
}) => {
  useEffect(() => {
    registerScrollHandler();
    const productLength = productStore.getState().products.length;
    if (productLength === 0) {
      loadProductsAndCategories();
    }

    return unregisterScrollHandler;
  }, []);

  return (
    <PageWrapper headerLeft={headerLeft}>
      {/* 검색 및 필터 */}
      <SearchBar serversideProps={serversideProps} serverRouter={serverRouter} />

      {/* 상품 목록 */}
      <div className="mb-6">
        <ProductList serversideProps={serversideProps} />
      </div>
    </PageWrapper>
  );
};

HomePage.loader = async (router: MemoryRouterInstance<typeof HomePage>) => {
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(router.query), getCategories()]);
  return { data: { products, categories, totalCount: total }, title: "쇼핑몰 - 홈" };
};
