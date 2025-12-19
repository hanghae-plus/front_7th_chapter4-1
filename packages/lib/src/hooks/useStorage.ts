import { useSyncExternalStore, useRef } from "react";
import type { createStorage } from "../createStorage";

/**
 * createStorage가 반환하는 스토리지 타입
 */
type Storage<T> = ReturnType<typeof createStorage<T>>;

/**
 * Storage를 React 훅으로 사용하기 위한 커스텀 훅
 *
 * 스토리지 값 변경 시 컴포넌트를 자동으로 리렌더링함
 * SSR 호환성을 위해 useSyncExternalStore 사용
 *
 * @template T - 스토리지에 저장되는 값의 타입
 *
 * @param storage - createStorage로 생성한 스토리지 인스턴스
 *
 * @returns 스토리지에 저장된 현재 값 (없으면 null)
 */
export const useStorage = <T>(storage: Storage<T>) => {
  // getServerSnapshot을 useRef로 캐싱하여 무한 루프 방지
  // React 19에서는 getServerSnapshot의 결과를 캐시해야 함
  // storage.get은 안정적인 함수이지만, 함수 참조 자체를 캐시하여 일관성 유지
  const getServerSnapshotRef = useRef<() => T | null>();
  if (!getServerSnapshotRef.current) {
    getServerSnapshotRef.current = () => storage.get();
  }

  // useSyncExternalStore를 사용하여 외부 스토어(스토리지) 구독
  return useSyncExternalStore(
    storage.subscribe, // 스토리지 값 변경 구독
    storage.get, // 클라이언트: 현재 스토리지 값 반환
    getServerSnapshotRef.current, // 서버: 캐시된 함수 사용 (항상 최신 값 반환)
  );
};
