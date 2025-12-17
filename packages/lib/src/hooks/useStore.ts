import type { createStore } from "../createStore";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

type Store<T> = ReturnType<typeof createStore<T>>;

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useStore = <T, S = T>(store: Store<T>, selector: (state: T) => S = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  // CRITICAL: 세 번째 인자 getServerSnapshot 추가!
  // React 18+ SSR에서 hydration mismatch를 방지하기 위해 필수
  return useSyncExternalStore(
    store.subscribe,
    () => shallowSelector(store.getState()),
    () => shallowSelector(store.getState()), // Server snapshot
  );
};
