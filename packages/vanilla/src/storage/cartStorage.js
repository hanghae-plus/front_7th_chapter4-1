import { createStorage, createMemoryStorage } from "../lib";
import { isServer } from "../constants";

export const cartStorage = isServer ? createMemoryStorage() : createStorage("shopping_cart");
