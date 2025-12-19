import { useRouter } from "@hanghae-plus/lib";
import { getRouter } from "../router";
import { isSSR, getSSRQuery } from "../ssrContext";

export const useRouterQuery = () => {
  // 서버 환경 체크
  const serverSide = isSSR();

  // CSR에서만 useRouter 호출
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clientQuery = serverSide ? null : useRouter(getRouter(), ({ query }) => query);

  // SSR 환경에서는 SSR Context에서 쿼리 가져오기
  if (serverSide) {
    return getSSRQuery();
  }

  return clientQuery!;
};
