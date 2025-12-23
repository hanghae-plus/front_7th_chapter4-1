import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";
import { browserPlatform, serverPlatform } from "@hanghae-plus/lib";

const platform = import.meta.env.SSR ? serverPlatform : browserPlatform;

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", platform.storage);
