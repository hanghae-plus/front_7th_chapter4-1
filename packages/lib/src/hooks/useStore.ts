import type { createStore } from "../createStore";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

/**
 * createStore가 반환하는 스토어 타입
 */
type Store<T> = ReturnType<typeof createStore<T>>;

/**
 * 기본 셀렉터 함수
 * 상태를 그대로 반환하거나 타입 변환만 수행
 */
const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

/**
 * Store를 React 훅으로 사용하기 위한 커스텀 훅
 *
 * 스토어 상태 변경 시 컴포넌트를 자동으로 리렌더링함
 * SSR 호환성을 위해 useSyncExternalStore 사용
 *
 * @template T - 스토어 상태 타입
 * @template S - 셀렉터가 반환하는 타입
 *
 * @param store - createStore로 생성한 스토어 인스턴스
 * @param selector - 스토어 상태에서 필요한 부분만 선택하는 함수 (옵션)
 *
 * @returns 셀렉터가 반환한 값 (기본값은 스토어 상태 전체)
 */
export const useStore = <T, S = T>(store: Store<T>, selector: (state: T) => S = defaultSelector<T, S>) => {
  // 얕은 비교를 통해 불필요한 리렌더링 방지
  const shallowSelector = useShallowSelector(selector);

  // useSyncExternalStore를 사용하여 외부 스토어 구독
  return useSyncExternalStore(
    store.subscribe, // 스토어 상태 변경 구독
    () => shallowSelector(store.getState()), // 현재 스토어 상태 반환 (클라이언트/서버 동일)
  );
};
