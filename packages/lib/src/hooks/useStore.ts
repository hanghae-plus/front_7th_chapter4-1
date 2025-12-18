import type { createStore } from "../createStore";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

type Store<T> = ReturnType<typeof createStore<T>>;

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useStore = <T, S = T>(store: Store<T>, selector: (state: T) => S = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  // getSnapshot: 클라이언트에서 사용할 현재 값
  const getSnapshot = () => shallowSelector(store.getState());

  // getServerSnapshot: 서버에서 사용할 현재 값 (SSR 지원)
  const getServerSnapshot = () => shallowSelector(store.getState());

  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
};
