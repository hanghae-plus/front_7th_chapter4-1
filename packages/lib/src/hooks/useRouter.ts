import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";
import type { RouterInstance } from "../routers";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useRouter = <T extends RouterInstance, S>(router: T, selector = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);
  return useSyncExternalStore(
    router.subscribe,
    () => shallowSelector(router),
    () => shallowSelector(router), // getServerSnapshot - 서버에서도 같은 값 사용
  );
};
