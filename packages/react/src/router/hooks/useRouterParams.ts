import { getRouter } from "../router";
import { useRouter } from "@hanghae-plus/lib";
import { isSSR, getSSRParams } from "../ssrContext";

type Params = Record<string, string | undefined>;

const defaultSelector = <S>(params: Params) => params as S;

export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  // 서버 환경 체크
  const serverSide = isSSR();

  // CSR에서만 useRouter 호출
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clientParams = serverSide ? null : useRouter(getRouter(), ({ params }) => selector(params));

  // SSR 환경에서는 SSR Context에서 파라미터 가져오기
  if (serverSide) {
    return selector(getSSRParams());
  }

  return clientParams as S;
};
