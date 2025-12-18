import { useSyncExternalStore } from "react";
import type { createStorage } from "../createStorage";

type Storage<T> = ReturnType<typeof createStorage<T>>;

export const useStorage = <T>(storage: Storage<T>) => {
  // SSR을 위한 getServerSnapshot 추가
  return useSyncExternalStore(storage.subscribe, storage.get, storage.get);
};
