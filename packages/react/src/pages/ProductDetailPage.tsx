import { ProductDetail, useLoadProductDetail, useProductStore } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import { withSSRPage } from "./lib";

export const ProductDetailPage = withSSRPage(
  () => {
    const { currentProduct: product, error, loading } = useProductStore();

    useLoadProductDetail();

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
  },
  {
    async getServerProps(router) {
      const { productService } = await import("../mocks/server");
      const productId = router.params.id;
      const product = await productService.getProduct(productId);
      const relatedProducts = await productService.getRelatedProducts(productId, product?.category2);

      const head = `<title>${product ? product.title : "상품 상세"} - 쇼핑몰</title>`;

      return { product, relatedProducts, head };
    },
  },
);
