import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";
import { isBrowser } from "../../../router/ssrContext";

type CartStorageData = {
  items: Cart[];
  selectedAll: boolean;
};

// 실제 스토리지 인스턴스 (브라우저에서만 생성)
let _cartStorage: ReturnType<typeof createStorage<CartStorageData>> | null = null;

/**
 * 실제 스토리지 인스턴스 가져오기 (Lazy Initialization)
 * - 브라우저: 실제 localStorage 기반 스토리지
 * - 서버: 더미 스토리지 (no-op)
 */
const getCartStorage = () => {
  if (!isBrowser()) {
    // 서버 환경: 더미 스토리지 반환
    return {
      get: () => null,
      set: () => {},
      reset: () => {},
      subscribe: () => () => {},
    };
  }

  // 브라우저 환경: 실제 스토리지 생성 (한 번만)
  if (!_cartStorage) {
    _cartStorage = createStorage<CartStorageData>("shopping_cart");
  }
  return _cartStorage;
};

/**
 * 장바구니 스토리지 프록시
 * - 기존 코드와의 호환성 유지
 * - 서버/클라이언트 환경에 따라 적절한 구현 사용
 */
export const cartStorage = {
  get: () => getCartStorage().get(),
  set: (value: CartStorageData) => getCartStorage().set(value),
  reset: () => getCartStorage().reset(),
  subscribe: (callback: () => void) => getCartStorage().subscribe(callback),
};
