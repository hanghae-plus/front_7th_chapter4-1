import { useEffect, useRef } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const routerQuery = useRouterQuery();
  const { query, search, limit, sort, category1, category2 } = routerQuery;
  // query 파라미터는 'query' 또는 'search' 둘 다 지원
  const searchQuery = query || search;
  const category = { category1, category2 };

  // 초기 마운트 시에는 loadProducts를 호출하지 않고, 의존성 변경 시에만 호출
  const isInitialMount = useRef(true);

  useEffect(() => {
    console.log(
      "[useProductFilter] Effect triggered, isInitialMount:",
      isInitialMount.current,
      "limit:",
      limit,
      "sort:",
      sort,
    );
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    console.log("[useProductFilter] Calling loadProducts with limit:", limit);
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
