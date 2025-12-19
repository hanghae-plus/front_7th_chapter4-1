import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const {
    search: searchQuery,
    limit,
    sort,
    category1,
    category2,
  } = useRouterQuery() as { search: string; limit: string; sort: string; category1: string; category2: string };
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
