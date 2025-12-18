import { useSyncExternalStore } from "react";
import { cartStore } from "../cartStore";

type CartState = ReturnType<(typeof cartStore)["getState"]>;

export const useCartStoreSelector = <T>(selector: (cart: CartState) => T) => {
  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  const getServerSnapshot = () => selector(cartStore.getState());

  // useSyncExternalStore를 직접 사용하여 getServerSnapshot 제공
  return useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getState()), getServerSnapshot);
};
