import { useStore } from "@hanghae-plus/lib";
import { cartStore } from "../cartStore";
import { isSSR } from "../../../router/ssrContext";

type CartState = ReturnType<(typeof cartStore)["getState"]>;

// SSR 환경에서 반환할 빈 장바구니 상태
const emptyCartState: CartState = {
  items: [],
  selectedAll: false,
};

export const useCartStoreSelector = <T>(selector: (cart: CartState) => T) => {
  // 서버 환경 체크
  const serverSide = isSSR();

  // CSR에서만 useStore 호출
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clientState = serverSide ? null : useStore(cartStore, selector);

  // SSR 환경에서는 빈 장바구니 반환
  if (serverSide) {
    return selector(emptyCartState);
  }

  return clientState as T;
};
