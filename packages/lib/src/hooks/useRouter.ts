import type { RouterInstance } from "../Router";
import type { MemoryRouter } from "../MemoryRouter";
import type { AnyFunction } from "../types";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

// Router 또는 MemoryRouter 둘 다 지원
type RouterLike<T extends AnyFunction> = RouterInstance<T> | MemoryRouter<T>;

export const useRouter = <T extends RouterLike<AnyFunction>, S>(router: T, selector = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  // getSnapshot: 클라이언트에서 사용할 현재 값
  const getSnapshot = () => shallowSelector(router);

  // getServerSnapshot: 서버에서 사용할 현재 값 (SSR 지원)
  const getServerSnapshot = () => shallowSelector(router);

  return useSyncExternalStore(router.subscribe, getSnapshot, getServerSnapshot);
};
