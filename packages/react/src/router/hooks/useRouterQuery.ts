import { useSyncExternalStore } from "react";
import { Router } from "@hanghae-plus/lib";
import { router } from "../router";

// SSR에서 URL을 저장할 전역 변수 (main-server.tsx에서 설정)
declare global {
  var __SSR_CURRENT_URL__: string | undefined;
}

export const useRouterQuery = () => {
  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  // SSR에서는 router.query가 빈 객체를 반환하므로, 전역 변수에서 URL을 읽어서 파싱
  const getServerSnapshot = () => {
    if (typeof window === "undefined" && typeof globalThis !== "undefined" && globalThis.__SSR_CURRENT_URL__) {
      const ssrUrl = globalThis.__SSR_CURRENT_URL__;
      // URL이 절대 경로가 아닌 경우 base URL 추가
      const fullUrl = ssrUrl.startsWith("http") ? ssrUrl : `http://localhost${ssrUrl}`;
      const url = new URL(fullUrl);
      return Router.parseQuery(url.search);
    }
    return router.query;
  };
  return useSyncExternalStore(router.subscribe, () => router.query, getServerSnapshot);
};
