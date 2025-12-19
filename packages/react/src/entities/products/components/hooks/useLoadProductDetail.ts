import { useEffect } from "react";
import { useRouterParams } from "../../../../router";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    if (!productId) return;
    const hasInitialData = window.__INITIAL_DATA__;
    if (!hasInitialData) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
