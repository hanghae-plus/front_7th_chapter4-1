/**
 * SSR 하이드레이션 유틸리티
 * 서버에서 렌더링된 초기 데이터를 클라이언트에서 활용하기 위한 헬퍼 함수
 */

declare global {
  interface Window {
    /** 서버에서 주입한 초기 데이터 (SSR/SSG용) */
    __INITIAL_DATA__?: Record<string, unknown>;
  }
}

/**
 * 서버에서 전달받은 초기 데이터가 존재하는지 확인
 *
 * @returns {boolean} 초기 데이터 존재 여부
 */
export function hasInitialData(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const initialData = window.__INITIAL_DATA__;
  return !!(initialData && typeof initialData === "object" && Object.keys(initialData).length > 0);
}

/**
 * SSR에서 전달받은 초기 데이터 처리
 *
 * React의 경우 ProductProvider에서 자동으로 처리하므로,
 * 여기서는 데이터 존재 여부만 확인하고 정리만 수행
 *
 * @returns {boolean} 하이드레이션 성공 여부
 */
export function hydrateFromSSR(): boolean {
  if (!hasInitialData()) {
    return false;
  }

  // React는 Context API를 통해 자동으로 하이드레이션되므로
  // 여기서는 데이터 정리만 수행
  clearInitialData();
  return true;
}

/**
 * 전역 객체에서 초기 데이터 제거
 * 하이드레이션 완료 후 메모리 정리를 위해 호출
 */
function clearInitialData(): void {
  if (typeof window === "undefined" || !window.__INITIAL_DATA__) {
    return;
  }

  try {
    delete window.__INITIAL_DATA__;
  } catch {
    // delete 연산이 실패하는 경우(일부 엄격한 환경) undefined로 대체
    window.__INITIAL_DATA__ = undefined;
  }
}
