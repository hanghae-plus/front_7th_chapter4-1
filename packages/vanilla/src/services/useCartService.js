import { CART_ACTIONS, UI_ACTIONS } from "../stores";
import { cartStorage } from "../storage";
import { StoreContext } from "../contexts";

export const useCartService = () => {
  const { cartStore, uiStore } = StoreContext.use();

  const loadCartFromStorage = () => {
    try {
      const savedCart = cartStorage.get();
      if (savedCart) {
        cartStore.dispatch({
          type: CART_ACTIONS.LOAD_FROM_STORAGE,
          payload: savedCart,
        });
      }
    } catch (error) {
      console.error("장바구니 로드 실패:", error);
    }
  };

  const saveCartToStorage = () => {
    try {
      const state = cartStore.getState();
      cartStorage.set(state);
    } catch (error) {
      console.error("장바구니 저장 실패:", error);
    }
  };

  const addToCart = (product, quantity = 1) => {
    cartStore.dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, quantity },
    });

    saveCartToStorage();

    uiStore.dispatch({
      type: UI_ACTIONS.SHOW_TOAST,
      payload: { message: "장바구니에 추가되었습니다", type: "success" },
    });

    setTimeout(() => {
      uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
    }, 3000);
  };

  const removeFromCart = (productId) => {
    cartStore.dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: productId,
    });
    saveCartToStorage();
  };

  const updateCartQuantity = (productId, quantity) => {
    cartStore.dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { productId, quantity },
    });
    saveCartToStorage();
  };

  const toggleCartSelect = (productId) => {
    cartStore.dispatch({
      type: CART_ACTIONS.TOGGLE_SELECT,
      payload: productId,
    });
    saveCartToStorage();
  };

  const selectAllCart = () => {
    cartStore.dispatch({ type: CART_ACTIONS.SELECT_ALL });
    saveCartToStorage();
  };

  const deselectAllCart = () => {
    cartStore.dispatch({ type: CART_ACTIONS.DESELECT_ALL });
    saveCartToStorage();
  };

  const removeSelectedFromCart = () => {
    cartStore.dispatch({ type: CART_ACTIONS.REMOVE_SELECTED });
    saveCartToStorage();

    uiStore.dispatch({
      type: UI_ACTIONS.SHOW_TOAST,
      payload: {
        message: "선택된 상품들이 삭제되었습니다",
        type: "info",
      },
    });

    setTimeout(() => {
      uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
    }, 3000);
  };

  const clearCart = () => {
    cartStore.dispatch({ type: CART_ACTIONS.CLEAR_CART });
    saveCartToStorage();

    uiStore.dispatch({
      type: UI_ACTIONS.SHOW_TOAST,
      payload: {
        message: "장바구니가 비워졌습니다",
        type: "info",
      },
    });

    setTimeout(() => {
      uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
    }, 3000);
  };

  return {
    loadCartFromStorage,
    saveCartToStorage,
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
