import { useSyncExternalStore } from "react";
import type { createStorage } from "../createStorage";

type Storage<T> = ReturnType<typeof createStorage<T>>;

export const useStorage = <T>(storage: Storage<T>) => {
  // SSR에서는 getServerSnapshot으로 동일한 함수 사용
  return useSyncExternalStore(storage.subscribe, storage.get, storage.get);
};
