import { useStore } from "@hanghae-plus/lib";
import { useStoreContext } from "../../StoreProvider";

export const useProductStore = () => {
  const { productStore } = useStoreContext();
  return useStore(productStore);
};
