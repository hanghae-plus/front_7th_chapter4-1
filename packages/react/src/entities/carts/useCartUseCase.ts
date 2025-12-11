import { useAutoCallback } from "@hanghae-plus/lib";
import type { Product } from "../products";
import { CART_ACTIONS } from "./cartStore";
import { useStoreContext } from "../StoreProvider";

export const useCartUseCase = () => {
  const { cartStore } = useStoreContext();

  const addToCart = useAutoCallback((product: Product, quantity = 1) => {
    cartStore.dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { product, quantity } });
  });

  const removeFromCart = useAutoCallback((productId: string) => {
    cartStore.dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: productId });
  });

  const updateCartQuantity = useAutoCallback((productId: string, quantity: number) => {
    cartStore.dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  });

  const toggleCartSelect = useAutoCallback((productId: string) => {
    cartStore.dispatch({ type: CART_ACTIONS.TOGGLE_SELECT, payload: productId });
  });

  const selectAllCart = useAutoCallback(() => {
    cartStore.dispatch({ type: CART_ACTIONS.SELECT_ALL });
  });

  const deselectAllCart = useAutoCallback(() => {
    cartStore.dispatch({ type: CART_ACTIONS.DESELECT_ALL });
  });

  const removeSelectedFromCart = useAutoCallback(() => {
    cartStore.dispatch({ type: CART_ACTIONS.REMOVE_SELECTED });
  });

  const clearCart = useAutoCallback(() => {
    cartStore.dispatch({ type: CART_ACTIONS.CLEAR_CART });
  });

  return {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    toggleCartSelect,
    selectAllCart,
    deselectAllCart,
    removeSelectedFromCart,
    clearCart,
  };
};
