import type { RouterInstance } from "../Router";
import type { AnyFunction } from "../types";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useRouter = <T extends RouterInstance<AnyFunction>, S>(router: T, selector = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);
  const getSnapshot = () => shallowSelector(router);
  // SSR hydration을 위해 getServerSnapshot 제공 (getSnapshot과 동일)
  return useSyncExternalStore(router.subscribe, getSnapshot, getSnapshot);
};
