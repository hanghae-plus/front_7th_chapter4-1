import { useSyncExternalStore } from "react";
import { productStore } from "../productStore";
import { useProductStoreContext } from "../ProductStoreContext";

export const useProductStore = () => {
  // 서버에서 주입한 Context가 있으면 우선 사용 (SSR)
  const contextData = useProductStoreContext();

  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  const getServerSnapshot = () => productStore.getState();

  // Hook은 항상 호출해야 함 (조건부 호출 불가)
  // useSyncExternalStore는 항상 호출하고, Context가 있으면 Context를 우선 사용
  const storeData = useSyncExternalStore(productStore.subscribe, () => productStore.getState(), getServerSnapshot);

  // Context가 있으면 바로 반환 (SSR에서 Context 데이터 우선 사용)
  // 클라이언트에서는 Context가 없을 때 store 데이터 사용
  return contextData || storeData;
};
