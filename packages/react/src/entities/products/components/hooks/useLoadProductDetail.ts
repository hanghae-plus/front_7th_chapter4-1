import { useRouterParams } from "../../../../router";
import { useEffect, useRef } from "react";
import { loadProductDetailForPage } from "../../productUseCase";
import { productStore } from "../../productStore";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const state = productStore.getState();
    // 서버에서 이미 해당 상품 데이터를 로드했다면 API 호출 스킵
    const hasServerData = state.currentProduct?.productId === productId && state.status === "done";

    if (!hasServerData || initialLoadDone.current) {
      loadProductDetailForPage(productId);
    }
    initialLoadDone.current = true;
  }, [productId]);
};
