import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { useProductUseCase } from "../../productUseCase";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };
  const { loadProducts } = useProductUseCase();

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
