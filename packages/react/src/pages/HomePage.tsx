import { ProductList, SearchBar, useLoadProducts } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { withSSRPage } from "./lib";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

export const HomePage = withSSRPage(
  () => {
    useLoadProducts();

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
  {
    async getServerProps(router) {
      const { productService } = await import("../mocks/server");
      const {
        products,
        pagination: { total: totalCount },
      } = await productService.getProducts(router.query);

      const categories = await productService.getCategories();

      const head = "<title>쇼핑몰 - 홈</title>";

      return { products, categories, totalCount, head };
    },
  },
);
