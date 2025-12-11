import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { useProductUseCase } from "../../useProductUseCase";

export const useProductFilter = () => {
  const { loadProducts } = useProductUseCase();
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2, loadProducts]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
