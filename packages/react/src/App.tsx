import { useEffect } from "react";
import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

// 전역 타입 선언
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: unknown[];
      categories?: unknown;
      totalCount?: number;
      pagination?: unknown;
      product?: unknown;
      relatedProducts?: unknown[];
    };
  }
}

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * SSR 초기 데이터 처리
 */
const SSRDataInitializer = () => {
  useEffect(() => {
    if (window.__INITIAL_DATA__) {
      const data = window.__INITIAL_DATA__;
      console.log("Loading SSR initial data:", data);

      // 홈페이지 데이터
      if (data.products && data.categories) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products: data.products,
            categories: data.categories,
            totalCount: data.totalCount || 0,
            loading: false,
            status: "done",
            error: null,
          },
        });
      }

      // 상품 상세 데이터
      if (data.product) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: data.product,
        });

        if (data.relatedProducts) {
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: data.relatedProducts,
          });
        }
      }

      // 사용 후 삭제 (중복 초기화 방지)
      delete window.__INITIAL_DATA__;
    }
  }, []);

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
      <SSRDataInitializer />
    </>
  );
};
