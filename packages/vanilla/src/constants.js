// 서버 사이드와 클라이언트 사이드 모두에서 동작하도록
const isProd =
  typeof process !== "undefined"
    ? process.env.NODE_ENV === "production"
    : typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.PROD
      : false;

export const BASE_URL = isProd ? "/front_7th_chapter4-1/vanilla/" : "/";
