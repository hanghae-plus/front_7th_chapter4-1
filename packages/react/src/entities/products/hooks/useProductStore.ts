import { useStore } from "@hanghae-plus/lib";
import { productStore } from "../productStore";

export const useProductStore = () => useStore(productStore);
