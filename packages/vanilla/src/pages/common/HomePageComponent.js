/** search: { searchQuery, limit, sort, category, categories } */
/** productData: {
  products,
  loading,
  error,
  totalCount,
  hasMore,
}*/

import { ProductList, SearchBar } from "../../components";
import { DefaultPageLayout } from "./DefaultPageLayout";

/** 서버와 공통으로 뺄 수 있는 컴포넌트 */
export const HomePageComponent = ({ search, productData }) => {
  return DefaultPageLayout({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
    children: `
      <!-- 검색 및 필터 -->
      ${SearchBar(search)}
      <!-- 상품 목록 -->
      <div class="mb-6">${ProductList(productData)}</div>
    `.trim(),
  });
};
