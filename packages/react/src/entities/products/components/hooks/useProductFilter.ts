import { useEffect, useRef } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";
import { productStore } from "../../productStore";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 첫 렌더링 시 SSR 데이터가 있으면 건너뛰기
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const state = productStore.getState();
      if (state.status === "done" && state.products.length > 0) {
        return;
      }
    }
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
