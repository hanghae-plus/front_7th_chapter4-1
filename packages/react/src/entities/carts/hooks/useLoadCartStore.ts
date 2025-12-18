import { useSyncExternalStore } from "react";
import { CART_ACTIONS, cartStore } from "../cartStore";
import { useEffect, useState } from "react";
import { cartStorage } from "../storage";

export const useLoadCartStore = () => {
  const [init, setInit] = useState(false);
  // SSR을 위한 getServerSnapshot 제공 (React 18+ 요구사항)
  const getServerSnapshot = () => cartStore.getState();
  const data = useSyncExternalStore(cartStore.subscribe, () => cartStore.getState(), getServerSnapshot);

  useEffect(() => {
    cartStore.dispatch({
      type: CART_ACTIONS.LOAD_FROM_STORAGE,
      payload: cartStorage.get(),
    });
    setInit(true);
  }, []);

  useEffect(() => {
    if (!init) {
      return;
    }
    cartStorage.set(data);
  }, [init, data]);
};
