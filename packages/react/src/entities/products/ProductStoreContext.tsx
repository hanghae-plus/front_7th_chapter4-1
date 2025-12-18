import { createContext, useContext } from "react";
import { initialProductState } from "./productStore";

export type ProductStoreState = typeof initialProductState;

export const ProductStoreContext = createContext<ProductStoreState | null>(null);

export const useProductStoreContext = () => useContext(ProductStoreContext);
