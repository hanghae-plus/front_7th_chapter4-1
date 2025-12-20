import { useSyncExternalStore } from "react";
import { router } from "../router";
import { shallowEquals } from "@hanghae-plus/lib";

// 모듈 레벨 캐시 (무한 루프 방지) - 클라이언트 전용
let cachedQuery = router.query;

// subscribe 시 캐시 업데이트
const subscribe = (callback: () => void) => {
  const unsubscribe = router.subscribe(() => {
    const newQuery = router.query;
    if (!shallowEquals(cachedQuery, newQuery)) {
      cachedQuery = newQuery;
    }
    callback();
  });
  return unsubscribe;
};

// 클라이언트: 캐시 반환 (무한 루프 방지)
const getSnapshot = () => cachedQuery;

// 서버: 매번 현재 router.query 반환 (각 요청마다 다른 query를 위해)
const getServerSnapshot = () => router.query;

export const useRouterQuery = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
