import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useProductUseCase } from "../../useProductUseCase";

export const useProductSearchHandlers = () => {
  const { searchProducts, setLimit, setSort, setCategory } = useProductUseCase();
  const handleSearchKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = e.currentTarget.value.trim();
      try {
        searchProducts(query);
      } catch (error) {
        console.error("검색 실패:", error);
      }
    }
  };

  // 페이지당 상품 수 변경
  const handleLimitChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const limit = parseInt(e.target.value);
    try {
      setLimit(limit);
    } catch (error) {
      console.error("상품 수 변경 실패:", error);
    }
  };

  // 정렬 변경
  const handleSortChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;

    try {
      setSort(sort);
    } catch (error) {
      console.error("정렬 변경 실패:", error);
    }
  };

  // 브레드크럼 카테고리 네비게이션
  const handleBreadCrumbClick = async (e: MouseEvent<HTMLButtonElement>) => {
    const breadcrumbType = e.currentTarget.getAttribute("data-breadcrumb");

    try {
      if (breadcrumbType === "reset") {
        // "전체" 클릭 -> 카테고리 초기화
        setCategory({ category1: "", category2: "" });
      } else if (breadcrumbType === "category1") {
        // 1depth 클릭 -> 2depth 제거하고 1depth만 유지
        const category1 = e.currentTarget.getAttribute("data-category1");
        setCategory({ ...(category1 && { category1 }), category2: "" });
      }
    } catch (error) {
      console.error("브레드크럼 네비게이션 실패:", error);
    }
  };

  // 1depth 카테고리 선택
  const handleMainCategoryClick = async (e: MouseEvent<HTMLButtonElement>) => {
    const category1 = e.currentTarget.getAttribute("data-category1");
    if (!category1) return;

    try {
      setCategory({ category1, category2: "" });
    } catch (error) {
      console.error("1depth 카테고리 선택 실패:", error);
    }
  };

  const handleSubCategoryClick = async (e: MouseEvent<HTMLButtonElement>) => {
    const category1 = e.currentTarget.getAttribute("data-category1");
    const category2 = e.currentTarget.getAttribute("data-category2");
    if (!category1 || !category2) return;

    try {
      setCategory({ category1, category2 });
    } catch (error) {
      console.error("2depth 카테고리 선택 실패:", error);
    }
  };

  return {
    handleSearchKeyDown,
    handleLimitChange,
    handleSortChange,
    handleBreadCrumbClick,
    handleMainCategoryClick,
    handleSubCategoryClick,
  };
};
