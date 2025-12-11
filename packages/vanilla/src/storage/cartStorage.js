import { createStorage } from "../lib";
import { isClient } from "../utils";

const currentStorage = isClient()
  ? window.localStorage
  : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

export const cartStorage = createStorage("shopping_cart", currentStorage);
