/**
 * 서버 렌더링 시 쿼리 파라미터를 저장하는 컨텍스트
 * HomePage 컴포넌트에서 서버 환경일 때 이 값을 사용
 * 클라이언트 환경에서는 빈 객체를 반환
 */
let currentServerQuery = {};

export const setServerQuery = (query) => {
  // 서버 환경에서만 작동
  if (typeof window === "undefined") {
    currentServerQuery = query || {};
  }
};

export const getServerQuery = () => {
  // 서버 환경에서만 작동, 클라이언트에서는 빈 객체 반환
  if (typeof window === "undefined") {
    return currentServerQuery;
  }
  return {};
};

export const clearServerQuery = () => {
  // 서버 환경에서만 작동
  if (typeof window === "undefined") {
    currentServerQuery = {};
  }
};
