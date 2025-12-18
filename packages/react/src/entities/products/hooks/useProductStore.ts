import { useStore } from "@hanghae-plus/lib";
import { productStore } from "../productStore";
import { useSSRStore } from "../../../router/RouterContext";

/**
 * 상품 스토어 구독 훅
 * - SSR: React Context의 스토어 사용 (요청별 격리된 스토어)
 * - CSR: 전역 productStore 사용
 */
export const useProductStore = () => {
  const ssrStore = useSSRStore();
  // SSR에서는 Context의 스토어, CSR에서는 전역 스토어 사용
  const store = ssrStore || productStore;
  return useStore(store);
};
