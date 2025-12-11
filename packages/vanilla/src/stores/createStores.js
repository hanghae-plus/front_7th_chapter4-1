import { createProductStore } from "./productStore";
import { createCartStore } from "./cartStore";
import { createUiStore } from "./uiStore";

export const createStores = ({ productState, cartState, uiState } = {}) => {
  return {
    productStore: createProductStore(productState),
    cartStore: createCartStore(cartState),
    uiStore: createUiStore(uiState),
  };
};
