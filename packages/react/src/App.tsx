import { useRouter } from "./router";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import type { FunctionComponent } from "react";

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
export const App = () => {
  const router = useRouter<FunctionComponent>();
  const PageComponent = router.target;

  return (
    <>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
