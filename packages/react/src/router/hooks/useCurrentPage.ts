import { getRouter } from "../router";
import { useRouter } from "@hanghae-plus/lib";
import { isSSR } from "../ssrContext";
import { serverRouter } from "../ServerRouter";
import type { FunctionComponent } from "react";

/**
 * 현재 페이지 컴포넌트 가져오기
 * - SSR: ServerRouter에서 컴포넌트 반환 (main-server.tsx에서 직접 렌더링)
 * - CSR: Router의 useSyncExternalStore로 현재 페이지 추적
 */
export const useCurrentPage = (): FunctionComponent | null | undefined => {
  // 서버 환경 체크
  const serverSide = isSSR();

  // CSR에서만 useRouter 호출
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clientPage = serverSide ? null : useRouter(getRouter(), ({ target }) => target);

  // SSR 환경에서는 main-server.tsx에서 직접 PageComponent를 렌더링하므로
  // App.tsx의 useCurrentPage는 호출되지 않아야 함
  if (serverSide) {
    return serverRouter.getNotFoundComponent();
  }

  return clientPage;
};
