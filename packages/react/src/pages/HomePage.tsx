import { useEffect } from "react";
import {
  loadNextProducts,
  loadProductsAndCategories,
  ProductList,
  SearchBar,
  useProductStoreWithSSR,
} from "../entities";
import { PageWrapper } from "./PageWrapper";
import { useRouter } from "../router";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

export const HomePage = () => {
  const router = useRouter();
  const { products, categories, status } = useProductStoreWithSSR();

  useEffect(() => {
    const handleScroll = () => loadNextProducts(router);
    window.addEventListener("scroll", handleScroll);
    if (products.length > 0 && Object.keys(categories).length > 0 && status === "done") {
      return;
    }
    loadProductsAndCategories(router);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [router]);

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
