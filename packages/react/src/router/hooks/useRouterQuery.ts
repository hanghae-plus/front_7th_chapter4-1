import { useRouter } from "@hanghae-plus/lib";
import { useRouterContext } from "../RouterProvider";

export const useRouterQuery = () => {
  const router = useRouterContext();
  return useRouter(router, ({ query }) => query);
};
