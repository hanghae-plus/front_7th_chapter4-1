import { useProductUseCase } from "../useProductUseCase";
import { useEffect } from "react";
import { useProductStore } from "./useProductStore";

export const useLoadProducts = () => {
  const { products, categories } = useProductStore();
  const { loadNextProducts, loadProductsAndCategories } = useProductUseCase();

  const loadable = products.length === 0 && Object.keys(categories).length === 0;

  useEffect(() => {
    if (loadable) {
      loadProductsAndCategories();
    }

    window.addEventListener("scroll", loadNextProducts);
    return () => window.removeEventListener("scroll", loadNextProducts);
  }, [loadNextProducts, loadProductsAndCategories, loadable]);

  useEffect(() => {
    document.title = "쇼핑몰 - 홈";
  }, []);
};
