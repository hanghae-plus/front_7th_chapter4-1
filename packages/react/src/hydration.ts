/**
 * Hydration 유틸리티
 *
 * SSR에서 생성된 HTML에 React를 연결하기 전에,
 * 서버에서 프리페칭한 데이터를 클라이언트 스토어에 복원합니다.
 *
 * 흐름:
 * 1. 서버: render() → HTML + initialData 생성
 * 2. 서버: window.__INITIAL_DATA__ = initialData 스크립트 삽입
 * 3. 클라이언트: hydrateFromServerData()로 스토어 복원
 * 4. 클라이언트: hydrateRoot()로 React 연결
 *
 * 참고: /packages/vanilla/src/main.js
 */
import { productStore, PRODUCT_ACTIONS } from "./entities";

// window 타입 확장
declare global {
  interface Window {
    __INITIAL_DATA__?: Record<string, unknown>;
  }
}

/**
 * 서버에서 프리페칭한 데이터를 클라이언트 스토어에 복원
 */
export function hydrateFromServerData(): void {
  // 1. 서버 환경 체크 (SSR 빌드 시 이 함수가 호출될 수 있음)
  if (typeof window === "undefined") return;

  // 2. 초기 데이터 존재 체크
  const initialData = window.__INITIAL_DATA__;
  if (!initialData) return;

  // 3. 스토어에 데이터 복원
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialData,
  });

  // 4. 사용 후 정리 (메모리 해제 및 중복 복원 방지)
  delete window.__INITIAL_DATA__;
}
