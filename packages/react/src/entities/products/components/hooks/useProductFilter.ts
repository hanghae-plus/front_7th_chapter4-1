import { useEffect } from "react";
import { useRouter } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const router = useRouter();
  const { search: searchQuery, limit, sort, category1, category2 } = router.query;
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts(router, true);
  }, [searchQuery, limit, sort, category1, category2, router]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
