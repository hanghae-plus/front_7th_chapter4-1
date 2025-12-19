import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { useProductStoreContext } from "../../hooks";

export const useLoadProductDetail = () => {
  const {
    action: { loadProductDetailForPage },
  } = useProductStoreContext();
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    loadProductDetailForPage(productId ?? "");
  }, [productId, loadProductDetailForPage]);
};
