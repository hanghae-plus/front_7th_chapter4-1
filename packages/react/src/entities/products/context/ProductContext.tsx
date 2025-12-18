import { type createStore, type StringRecord } from "@hanghae-plus/lib";
import { getCategories, getProduct, getProducts } from "../../../api/productApi";
import { isNearBottom } from "../../../utils";
import { ProductStoreContext } from "../hooks";
import { initialProductState, PRODUCT_ACTIONS, type ProductState } from "../productStore";
import { useStore } from "@hanghae-plus/lib";
import { useRouterContext } from "../../../router/hooks/useRouterContext";

/**
 * ProductProvider의 props 타입
 */
interface ProductProviderProps {
  /** 상품 스토어 인스턴스 */
  productStore: ReturnType<typeof createStore<ProductState, unknown>>;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * 에러 객체에서 메시지를 추출하는 헬퍼 함수
 *
 * @param {unknown} error - 에러 객체
 * @param {string} [defaultMessage="알 수 없는 오류 발생"] - 기본 에러 메시지
 * @returns {string} 에러 메시지
 */
const createErrorMessage = (error: unknown, defaultMessage = "알 수 없는 오류 발생"): string => {
  return error instanceof Error ? error.message : defaultMessage;
};

/**
 * ProductProvider 컴포넌트
 *
 * 상품 스토어와 관련 액션들을 Context API를 통해 하위 컴포넌트에 제공함
 * 상품 목록 로딩, 검색, 필터링, 상세 페이지 로딩 등의 기능을 제공
 *
 * @param {ProductProviderProps} props - 컴포넌트 props
 * @param {ReturnType<typeof createStore>} props.productStore - 상품 스토어 인스턴스
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @returns {JSX.Element} ProductStoreContext.Provider 컴포넌트
 */
export const ProductProvider = ({ children, productStore }: ProductProviderProps) => {
  // 스토어 상태 구독 (상태 변경 시 자동 리렌더링)
  const productStoreState = useStore(productStore);
  const router = useRouterContext();

  /**
   * 상품 목록을 로드하는 함수
   *
   * @param {boolean} [resetList=true] - 목록을 초기화할지 여부 (true: 초기화, false: 추가)
   * @returns {Promise<void>}
   * @throws {Error} API 호출 실패 시 에러 발생
   */
  const loadProducts = async (resetList = true): Promise<void> => {
    try {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: { loading: true, status: "pending", error: null },
      });

      const {
        products,
        pagination: { total },
      } = await getProducts(router.query);
      const payload = { products, totalCount: total };

      // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
      if (resetList) {
        productStore.dispatch({ type: PRODUCT_ACTIONS.SET_PRODUCTS, payload });
        return;
      }
      productStore.dispatch({ type: PRODUCT_ACTIONS.ADD_PRODUCTS, payload });
    } catch (error) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_ERROR,
        payload: createErrorMessage(error),
      });
      throw error;
    }
  };

  /**
   * 상품 목록과 카테고리를 동시에 로드하는 함수
   * 홈 페이지 초기 로딩 시 사용
   *
   * @returns {Promise<void>}
   * @throws {Error} API 호출 실패 시 에러 발생
   */
  const loadProductsAndCategories = async (): Promise<void> => {
    try {
      const [
        {
          products,
          pagination: { total },
        },
        categories,
      ] = await Promise.all([getProducts(router.query), getCategories()]);

      // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products,
          categories,
          totalCount: total,
          loading: false,
          status: "done",
        },
      });
    } catch (error: unknown) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_ERROR,
        payload: createErrorMessage(error),
      });
      throw error;
    }
  };

  /**
   * 다음 페이지 상품을 로드하는 함수 (무한 스크롤용)
   * 현재 페이지 번호를 증가시켜 추가 상품을 로드함
   *
   * @returns {Promise<void>}
   */
  const loadMoreProducts = async (): Promise<void> => {
    const state = productStore.getState();
    const hasMore = state.products.length < state.totalCount;

    // 더 이상 로드할 데이터가 없거나 로딩 중이면 중단
    if (!hasMore || state.loading) {
      return;
    }

    // 다음 페이지로 이동하여 상품 추가 로드
    router.query = { ...router.query, current: (Number(router.query?.current || 1) + 1).toString() };
    await loadProducts(false);
  };

  /**
   * 검색어를 설정하고 상품 목록을 다시 로드하는 함수
   *
   * @param {string} search - 검색어
   */
  const searchProducts = (search: string): void => {
    router.query = { ...router.query, search, current: "1" };
  };

  /**
   * 카테고리를 설정하고 상품 목록을 다시 로드하는 함수
   *
   * @param {StringRecord} categoryData - 카테고리 데이터 (category1, category2 등)
   */
  const setCategory = (categoryData: StringRecord): void => {
    router.query = { ...router.query, ...categoryData, current: "1" };
  };

  /**
   * 정렬 방식을 설정하고 상품 목록을 다시 로드하는 함수
   *
   * @param {string} sort - 정렬 방식 (price_asc, price_desc, name_asc, name_desc)
   */
  const setSort = (sort: string): void => {
    router.query = { ...router.query, sort, current: "1" };
  };

  /**
   * 페이지당 상품 개수를 설정하고 상품 목록을 다시 로드하는 함수
   *
   * @param {number} limit - 페이지당 상품 개수
   */
  const setLimit = (limit: number): void => {
    router.query = { ...router.query, limit: limit.toString(), current: "1" };
  };

  /**
   * 상품 상세 페이지를 위한 데이터를 로드하는 함수
   * 현재 상품과 관련 상품을 함께 로드함
   *
   * @param {string} productId - 상품 ID
   * @returns {Promise<void>}
   * @throws {Error} API 호출 실패 시 에러 발생
   */
  const loadProductDetailForPage = async (productId: string): Promise<void> => {
    try {
      const currentProduct = productStore.getState().currentProduct;

      // 이미 같은 상품이 로드되어 있으면 관련 상품만 로드
      if (productId === currentProduct?.productId) {
        if (currentProduct.category2) {
          await loadRelatedProducts(currentProduct.category2, productId);
        }
        return;
      }

      // 다른 상품을 로드하기 전에 상태 초기화
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          ...initialProductState,
          currentProduct: null,
          loading: true,
          status: "pending",
        },
      });

      // 상품 상세 정보 로드
      const product = await getProduct(productId);

      // 현재 상품 설정
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품 로드 (같은 category2 기준)
      if (product.category2) {
        await loadRelatedProducts(product.category2, productId);
      }
    } catch (error) {
      console.error("상품 상세 페이지 로드 실패:", error);
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_ERROR,
        payload: createErrorMessage(error),
      });
      throw error;
    }
  };

  /**
   * 관련 상품을 로드하는 함수
   * 같은 카테고리(category2)의 상품 중 현재 상품을 제외하고 로드함
   *
   * @param {string} category2 - 카테고리2 값
   * @param {string} excludeProductId - 제외할 상품 ID (현재 상품)
   * @returns {Promise<void>}
   */
  const loadRelatedProducts = async (category2: string, excludeProductId: string): Promise<void> => {
    try {
      const params = {
        category2,
        limit: String(20), // 관련 상품 20개
        page: String(1),
      };

      const response = await getProducts(params);

      // 현재 상품 제외
      const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: relatedProducts,
      });
    } catch (error) {
      console.error("관련 상품 로드 실패:", error);
      // 관련 상품 로드 실패는 전체 페이지에 영향주지 않도록 조용히 처리
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: [],
      });
    }
  };

  /**
   * 무한 스크롤을 위한 다음 상품 로드 함수
   * 스크롤이 하단 근처에 도달했을 때 자동으로 호출됨
   * 홈 페이지에서만 동작함
   *
   * @returns {Promise<void>}
   */
  const loadNextProducts = async (): Promise<void> => {
    // 현재 라우트가 홈이 아니면 무한 스크롤 비활성화
    if (router.route?.path !== "/") {
      return;
    }

    // 스크롤이 하단 200px 이내에 도달했는지 확인
    if (isNearBottom(200)) {
      const productState = productStore.getState();
      const hasMore = productState.products.length < productState.totalCount;

      // 로딩 중이거나 더 이상 로드할 데이터가 없으면 중단
      if (productState.loading || !hasMore) {
        return;
      }

      try {
        await loadMoreProducts();
      } catch (error) {
        console.error("무한 스크롤 로드 실패:", error);
      }
    }
  };

  return (
    <ProductStoreContext.Provider
      value={{
        store: productStore,
        state: productStoreState,
        action: {
          loadProducts,
          loadProductsAndCategories,
          searchProducts,
          setCategory,
          setSort,
          setLimit,
          loadProductDetailForPage,
          loadRelatedProducts,
          loadNextProducts,
        },
      }}
    >
      {children}
    </ProductStoreContext.Provider>
  );
};
