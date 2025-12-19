import { useEffect, useRef } from "react";
import { useRouterContext, useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const router = useRouterContext();
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };
  const isFirstMount = useRef(true);
  const prevQuery = useRef({ search: searchQuery, limit, sort, category1, category2 });

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevQuery.current = { search: searchQuery, limit, sort, category1, category2 };
      return;
    }

    const currentQuery = { search: searchQuery, limit, sort, category1, category2 };
    const hasChanged =
      prevQuery.current.search !== currentQuery.search ||
      prevQuery.current.limit !== currentQuery.limit ||
      prevQuery.current.sort !== currentQuery.sort ||
      prevQuery.current.category1 !== currentQuery.category1 ||
      prevQuery.current.category2 !== currentQuery.category2;

    if (hasChanged) {
      prevQuery.current = currentQuery;
      loadProducts(router, true);
    }
  }, [router, searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
