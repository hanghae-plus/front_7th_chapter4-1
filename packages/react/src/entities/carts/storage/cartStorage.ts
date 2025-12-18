import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";

// SSR-safe: 서버에서는 실행하지 않도록 lazy initialization
let _cartStorage: ReturnType<typeof createStorage<{ items: Cart[]; selectedAll: boolean }>> | null = null;

const getCartStorage = () => {
  if (!_cartStorage) {
    // 클라이언트에서만 실행
    if (typeof window !== "undefined") {
      _cartStorage = createStorage<{
        items: Cart[];
        selectedAll: boolean;
      }>("shopping_cart");
    } else {
      // 서버에서는 빈 storage 객체 반환
      _cartStorage = {
        get: () => null,
        set: () => {},
        reset: () => {},
        subscribe: () => () => {},
      } as ReturnType<typeof createStorage<{ items: Cart[]; selectedAll: boolean }>>;
    }
  }
  return _cartStorage;
};

export const cartStorage = {
  get: () => getCartStorage().get(),
  set: (value: { items: Cart[]; selectedAll: boolean }) => getCartStorage().set(value),
  reset: () => getCartStorage().reset(),
  subscribe: (fn: () => void) => getCartStorage().subscribe(fn),
};
