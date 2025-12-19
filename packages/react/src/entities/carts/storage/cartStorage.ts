import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart");
