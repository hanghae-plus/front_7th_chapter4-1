import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { QueryProvider } from "./contexts/QueryContext";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const App = ({ initialData }: { initialData?: any }) => {
  const PageComponent = useCurrentPage();

  return (
    <QueryProvider initialQuery={initialData?.query || {}}>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent initialData={initialData} /> : null}</ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </QueryProvider>
  );
};
