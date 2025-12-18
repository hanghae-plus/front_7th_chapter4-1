import { useSyncExternalStore } from "react";
import { router } from "../router";

export const useRouterQuery = () => {
  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  const getServerSnapshot = () => router.query;
  return useSyncExternalStore(router.subscribe, () => router.query, getServerSnapshot);
};
