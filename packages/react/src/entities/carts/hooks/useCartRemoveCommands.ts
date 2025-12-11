import { useToastCommand } from "../../../components";
import { useAutoCallback } from "@hanghae-plus/lib";
import { useCartUseCase } from "../useCartUseCase";

export const useCartRemoveCommands = () => {
  const { removeSelectedFromCart, clearCart } = useCartUseCase();
  const toast = useToastCommand();

  const removeSelected = useAutoCallback(() => {
    removeSelectedFromCart();
    toast.show("선택된 상품들이 삭제되었습니다", "info");
  });

  const clear = useAutoCallback(() => {
    clearCart();
    toast.show("장바구니가 비워졌습니다", "info");
  });

  return { removeSelected, clear };
};
