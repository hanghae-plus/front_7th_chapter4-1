import { useEffect, useCallback } from "react";
import { ProductList, SearchBar, useProductStoreContext } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { withServerSideProps } from "../utils";
import { getProducts, getCategories } from "../api/productApi";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

export const HomePage = withServerSideProps(
  {
    ssr: async ({ query }) => {
      const [
        {
          products,
          pagination: { total },
        },
        categories,
      ] = await Promise.all([getProducts(query), getCategories()]);

      return {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      };
    },
    metadata: async () => {
      return {
        title: "쇼핑몰 - 홈",
      };
    },
  },
  () => {
    const {
      action: { loadProductsAndCategories, loadNextProducts },
    } = useProductStoreContext();

    // 무한 스크롤 이벤트 등록/해제 함수를 useCallback으로 메모이제이션
    // loadNextProducts가 안정적인 참조를 보장하므로 의존성 배열에 포함
    const registerScrollHandler = useCallback(() => {
      window.addEventListener("scroll", loadNextProducts);
    }, [loadNextProducts]);

    const unregisterScrollHandler = useCallback(() => {
      window.removeEventListener("scroll", loadNextProducts);
    }, [loadNextProducts]);

    useEffect(() => {
      registerScrollHandler();
      loadProductsAndCategories();

      return unregisterScrollHandler;
    }, [registerScrollHandler, loadProductsAndCategories, unregisterScrollHandler]);

    return (
      <PageWrapper headerLeft={headerLeft}>
        {/* 검색 및 필터 */}
        <SearchBar />

        {/* 상품 목록 */}
        <div className="mb-6">
          <ProductList />
        </div>
      </PageWrapper>
    );
  },
);
