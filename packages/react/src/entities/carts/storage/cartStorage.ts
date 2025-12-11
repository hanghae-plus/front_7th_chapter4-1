import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";
import { isClient } from "../../../utils";

const storage = isClient()
  ? window.localStorage
  : ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    } as unknown as Storage);

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", storage);
