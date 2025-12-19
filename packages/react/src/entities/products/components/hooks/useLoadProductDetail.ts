import { useEffect } from "react";
import { useRouterParams } from "../../../../router";
import { productStore } from "../../productStore";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);

  useEffect(() => {
    if (!productId) return;

    const state = productStore.getState();
    if (!state.currentProduct || state.currentProduct.productId !== productId || state.loading) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
