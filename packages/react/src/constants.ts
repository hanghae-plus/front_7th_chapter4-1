// SSR에서는 서버가 URL을 정규화하므로 "/" 사용
export const BASE_URL = import.meta.env.SSR ? "/" : import.meta.env.PROD ? "/front_7th_chapter4-1/react/" : "/";
