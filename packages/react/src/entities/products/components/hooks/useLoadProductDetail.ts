import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { useProductUseCase } from "../../useProductUseCase";
import { useProductStore } from "../../hooks";

export const useLoadProductDetail = () => {
  const { currentProduct } = useProductStore();
  const productId = useRouterParams((params) => params.id);
  const { loadProductDetailForPage } = useProductUseCase();
  const title = currentProduct?.title;

  useEffect(() => {
    if (productId) {
      loadProductDetailForPage(productId);
    }
  }, [loadProductDetailForPage, productId]);

  useEffect(() => {
    if (title) {
      document.title = `${title} - 쇼핑몰`;
    }
  }, [title]);
};
