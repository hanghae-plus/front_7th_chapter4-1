import { ProductDetail, useLoadProductDetail, useProductStore, type Product } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import { getProduct } from "../api/productApi";
import type { MemoryRouterInstance } from "@hanghae-plus/lib";
import { getRelatedProducts } from "../entities/products/productUseCase";

export const ProductDetailPage = ({
  serversideProps,
}: {
  serversideProps: { currentProduct: Product; relatedProducts: Product[]; error: string | null; loading: boolean };
}) => {
  const storeState = useProductStore();
  const { currentProduct: product, error, loading } = serversideProps ?? storeState;

  useLoadProductDetail();

  return (
    <PageWrapper
      headerLeft={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.history.back();
              }
            }}
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
        {product && <ProductDetail product={product} serversideProps={serversideProps} />}
      </div>
    </PageWrapper>
  );
};

ProductDetailPage.loader = async (router: MemoryRouterInstance<typeof ProductDetailPage>) => {
  const [currentProduct, relatedProducts] = await Promise.all([
    getProduct(router.params?.id),
    getRelatedProducts(router.params?.category2 ?? "", router.params?.id),
  ]);
  return { data: { currentProduct, relatedProducts }, title: `${currentProduct?.title} - 쇼핑몰` };
};
