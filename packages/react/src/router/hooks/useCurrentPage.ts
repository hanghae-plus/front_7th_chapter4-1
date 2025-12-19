import { useRouter } from "@hanghae-plus/lib";
import { useRouterContext } from "../RouterContext";

export const useCurrentPage = () => {
  const router = useRouterContext();
  return useRouter(router, ({ target }) => target);
};
