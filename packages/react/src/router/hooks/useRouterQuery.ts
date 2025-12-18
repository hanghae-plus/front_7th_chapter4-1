import { useRouter } from "@hanghae-plus/lib";
import { router } from "../router";
import { useServerRouterContext } from "../RouterContext";
import type { StringRecord } from "../../types";

export const useRouterQuery = (): StringRecord => {
  // SSR 시 ServerRouter의 query 사용
  const serverContext = useServerRouterContext();

  // 클라이언트에서 라우터 쿼리 변경 구독
  const clientQuery = useRouter(router, (r) => r.query);

  // SSR context가 있고 클라이언트가 아니면 그것을 사용
  // hydration 후에는 클라이언트 라우터 사용
  if (typeof window === "undefined" && serverContext?.query) {
    return serverContext.query;
  }

  return clientQuery;
};
