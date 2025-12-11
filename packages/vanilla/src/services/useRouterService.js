import { RouterContext } from "../contexts";

export const useRouterService = () => {
  const router = RouterContext.use();

  const searchProducts = (search) => {
    router.query = { search, current: 1 };
  };

  const setCategory = (categoryData) => {
    router.query = { ...categoryData, current: 1 };
  };

  const setSort = (sort) => {
    router.query = { sort, current: 1 };
  };

  const setLimit = (limit) => {
    router.query = { limit, current: 1 };
  };

  return {
    searchProducts,
    setCategory,
    setSort,
    setLimit,
    router,
  };
};
