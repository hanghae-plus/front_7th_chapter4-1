import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    // SSR에서 이미 데이터가 로드된 경우 다시 로드하지 않음
    const hasInitialData = typeof window !== "undefined" && window.__INITIAL_DATA__;
    if (!hasInitialData) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
