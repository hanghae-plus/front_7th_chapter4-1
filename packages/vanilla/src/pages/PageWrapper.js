import { cartStore, uiStore } from "../stores";
import { DefaultPageLayout } from "./common/DefaultPageLayout";

export const PageWrapper = ({ headerLeft, children }) => {
  const cart = cartStore.getState();
  const { cartModal, toast } = uiStore.getState();
  const cartSize = cart.items.length;

  return DefaultPageLayout({
    headerLeft,
    children,
    data: {
      cartSize,
      cart: { ...cart, isOpen: cartModal.isOpen },
      toast,
    },
  });
};
