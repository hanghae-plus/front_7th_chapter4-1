import { createProductStore } from "../stores/productStore.js";

export const createRequestContextBase = () => {
  const store = createProductStore();
  return { store, router: null, query: {} };
};
