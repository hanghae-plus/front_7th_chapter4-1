import { useRouter } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";
import { useProductStoreWithSSR } from "../../hooks";

export const useLoadProductDetail = () => {
  const { params } = useRouter();
  const productId = params.id;
  const { currentProduct, status } = useProductStoreWithSSR();
  useEffect(() => {
    // 현재 보려는 상품이 이미 로드되어 있으면 스킵
    if (currentProduct?.productId === productId && status === "done") {
      return;
    }
    if (productId) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
