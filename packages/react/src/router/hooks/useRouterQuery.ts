import { useRouter } from "@hanghae-plus/lib";
import { router } from "../router";
import { useSSRQuery } from "../RouterContext";

export const useRouterQuery = () => {
  // SSR 환경이면 컨텍스트에서 쿼리 가져오기
  const ssrQuery = useSSRQuery();
  // CSR 환경이면 클라이언트 라우터 사용
  const csrQuery = useRouter(router, ({ query }) => query);

  return ssrQuery ?? csrQuery;
};
