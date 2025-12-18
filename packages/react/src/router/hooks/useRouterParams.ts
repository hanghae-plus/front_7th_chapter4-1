import { useSyncExternalStore } from "react";
import { router } from "../router";

type Params = Record<string, string | undefined>;

const defaultSelector = <S>(params: Params) => params as S;

export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  const getServerSnapshot = () => selector(router.params);
  return useSyncExternalStore(router.subscribe, () => selector(router.params), getServerSnapshot);
};
