import { useSyncExternalStore } from "react";
import type { createStorage } from "../createStorage";

type Storage<T> = ReturnType<typeof createStorage<T>>;

export const useStorage = <T>(storage: Storage<T>) => {
  // getSnapshot: 클라이언트에서 사용할 현재 값
  const getSnapshot = storage.get;

  // getServerSnapshot: 서버에서 사용할 현재 값 (SSR 지원)
  const getServerSnapshot = storage.get;

  return useSyncExternalStore(storage.subscribe, getSnapshot, getServerSnapshot);
};
