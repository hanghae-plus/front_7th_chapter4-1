import { useEffect } from "react";
import { useRouterContext, useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const router = useRouterContext();
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts(router, true);
  }, [router, searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
