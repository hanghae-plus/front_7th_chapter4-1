import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { useProductStoreContext } from "../../hooks";

export const useProductFilter = () => {
  const {
    action: { loadProducts },
  } = useProductStoreContext();
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
