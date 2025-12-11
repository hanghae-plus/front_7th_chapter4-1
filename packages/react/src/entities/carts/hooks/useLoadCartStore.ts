import { useStore } from "@hanghae-plus/lib";
import { CART_ACTIONS } from "../cartStore";
import { useEffect, useState } from "react";
import { cartStorage } from "../storage";
import { useStoreContext } from "../../StoreProvider";

export const useLoadCartStore = () => {
  const { cartStore } = useStoreContext();
  const [init, setInit] = useState(false);
  const data = useStore(cartStore);

  useEffect(() => {
    cartStore.dispatch({
      type: CART_ACTIONS.LOAD_FROM_STORAGE,
      payload: cartStorage.get(),
    });
    setInit(true);
  }, [cartStore]);

  useEffect(() => {
    if (!init) {
      return;
    }
    cartStorage.set(data);
  }, [init, data]);
};
