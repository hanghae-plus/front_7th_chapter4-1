import type { RouterInstance } from "../Router";
import type { AnyFunction } from "../types";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";
import type { ServerRouterInstance } from "../ServerRouter";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

type RouterType = RouterInstance<AnyFunction> | ServerRouterInstance<AnyFunction>;

export const useRouter = <T extends RouterType, S>(router: T, selector = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  return useSyncExternalStore(
    router.subscribe,
    () => shallowSelector(router),
    () => shallowSelector(router),
  );
};
