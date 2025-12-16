/**
 * 서버 환경인지 확인
 * @returns {boolean} 서버 환경이면 true, 클라이언트 환경이면 false
 */
export const isServer = () => typeof window === "undefined";
