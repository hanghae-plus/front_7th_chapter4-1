import { useCurrentPage } from "./router";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
export const App = () => {
  const PageComponent = useCurrentPage();

  return (
    <>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
