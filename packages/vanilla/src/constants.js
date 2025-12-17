export const BASE_URL =
  (typeof process !== "undefined" && process.env.NODE_ENV === "production") ||
  (typeof import.meta !== "undefined" && import.meta.env?.PROD)
    ? "/front_7th_chapter4-1/vanilla/"
    : "/";
