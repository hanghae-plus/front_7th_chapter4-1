import { useSyncExternalStore } from "react";
import type { createStorage } from "../createStorage";

type Storage<T> = ReturnType<typeof createStorage<T>>;

export const useStorage = <T>(storage: Storage<T>) => {
  return useSyncExternalStore(
    storage.subscribe,
    storage.get, // 클라이언트
    storage.get, // 서버 (동일한 초기 상태)
  );
};
