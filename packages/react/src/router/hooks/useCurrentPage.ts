import { router } from "../router";
import { useRouter } from "@hanghae-plus/lib";
import { useSSRRoute } from "../RouterContext";

export const useCurrentPage = () => {
  // SSR 환경이면 컨텍스트에서 라우트 정보 가져오기
  const ssrRoute = useSSRRoute();
  // CSR 환경이면 클라이언트 라우터 사용
  const csrTarget = useRouter(router, ({ target }) => target);

  return ssrRoute ? ssrRoute.handler : csrTarget;
};
