import { useEffect } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar, productStore } from "../entities";
import { PageWrapper } from "./PageWrapper";

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
  if (scrollHandlerRegistered) return;

  window.addEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = () => {
  if (!scrollHandlerRegistered) return;
  window.removeEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = false;
};

export const HomePage = () => {
  useEffect(() => {
    registerScrollHandler();
    const state = productStore.getState();

    // 스토어가 비어있을 때만 초기 로드 (SSR 데이터가 없는 경우)
    if (!state.products || state.products.length === 0) {
      loadProductsAndCategories();
    }

    return unregisterScrollHandler;
  }, []);

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
};
