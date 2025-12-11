import { createProductStore } from "./products";
import { createCartStore } from "./carts";

type ProductState = Parameters<typeof createProductStore>[0];

export const createStores = ({ productState }: { productState?: ProductState } = {}) => {
  const productStore = createProductStore(productState);
  const cartStore = createCartStore();

  return { productStore, cartStore };
};
