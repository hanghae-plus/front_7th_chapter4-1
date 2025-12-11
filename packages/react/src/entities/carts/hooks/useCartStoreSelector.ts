import { useStore } from "@hanghae-plus/lib";
import { cartStore } from "../cartStore";
import { useStoreContext } from "../../StoreProvider";

type CartState = ReturnType<(typeof cartStore)["getState"]>;

export const useCartStoreSelector = <T>(selector: (cart: CartState) => T) => {
  const { cartStore } = useStoreContext();
  return useStore(cartStore, selector);
};
