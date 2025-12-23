import { useEffect } from "react";
import { ProductDetail } from "../entities";
import { productStore, type initialProductState } from "../entities/products/productStore";
import { loadProductDetailForPage } from "../entities/products/productUseCase";
import { useRouterParams } from "../router";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import { useStore } from "@hanghae-plus/lib";

export const ProductDetailPage = () => {
  const state = useStore(productStore) as typeof initialProductState;
  const { currentProduct: product, error, loading } = state;
  const productId = useRouterParams((params) => params.id) as string;

  useEffect(() => {
    if (window.__HYDRATED__) {
      window.__HYDRATED__ = false;
      return;
    }

    loadProductDetailForPage(productId);
  }, [productId]);

  return (
    <PageWrapper
      headerLeft={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <PublicImage src="/back-icon.svg" alt="뒤로" className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 p-4">
        {loading && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        )}
        {error && <ErrorContent error={error} />}
        {product && <ProductDetail {...product} />}
      </div>
    </PageWrapper>
  );
};
