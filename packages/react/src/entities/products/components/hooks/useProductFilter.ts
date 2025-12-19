import { useEffect, useRef } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";
import { productStore } from "../../productStore";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 첫 렌더링 시 SSR 데이터가 있으면 스킵
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const currentState = productStore.getState();
      if (currentState.products.length > 0 && currentState.status === "done") {
        console.log("[useProductFilter] SSR 데이터 있음 - 첫 로드 스킵");
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
