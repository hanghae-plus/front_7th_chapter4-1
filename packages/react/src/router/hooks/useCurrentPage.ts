import { useSyncExternalStore } from "react";
import { router } from "../router";

export const useCurrentPage = () => {
  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  const getServerSnapshot = () => router.target;
  return useSyncExternalStore(router.subscribe, () => router.target, getServerSnapshot);
};
