import { useCallback } from "react";
import { useToastCommand } from "../../../components";
import type { Product } from "../../products";
import { addToCart } from "../cartUseCase";

export const useCartAddCommand = () => {
  const toast = useToastCommand();
  // useAutoCallback 대신 useCallback 사용 (SSR 호환)
  return useCallback(
    (product: Product, quantity = 1) => {
      addToCart(product, quantity);
      toast.show("장바구니에 추가되었습니다", "success");
    },
    [toast],
  );
};
