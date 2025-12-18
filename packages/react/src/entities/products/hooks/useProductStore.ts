import { useStore } from "@hanghae-plus/lib";
import { productStore } from "../productStore";
import { useProductStoreContext } from "../ProductStoreContext";

export const useProductStore = () => {
  // 서버에서 주입한 Context가 있으면 우선 사용 (SSR)
  const contextData = useProductStoreContext();

  // Hook은 항상 호출해야 함 (조건부 호출 불가)
  const storeData = useStore(productStore);

  // Context가 있으면 Context 사용, 없으면 store 사용
  return contextData ?? storeData;
};
