import { getProduct, getProducts, getUniqueCategories } from "./mockUtils.js";

export const productService = {
  getProducts: (query) => Promise.resolve(getProducts(query)),
  getProduct: (id) => Promise.resolve(getProduct(id)),
  getCategories: () => Promise.resolve(getUniqueCategories()),
  getRelatedProducts: async (productId, category2) => {
    const { products } = await productService.getProducts({ category2, limit: 20 });
    return products.filter((p) => p.productId !== productId);
  },
};
