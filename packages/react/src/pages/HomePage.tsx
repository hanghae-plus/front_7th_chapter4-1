import { useEffect, useRef } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar, useProductStore } from "../entities";
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
  const { products, status } = useProductStore();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    registerScrollHandler();

    // 서버에서 이미 데이터를 로드했다면 API 호출 스킵
    const hasServerData = products.length > 0 && status === "done";
    if (!hasServerData && !initialLoadDone.current) {
      loadProductsAndCategories();
    }
    initialLoadDone.current = true;

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
