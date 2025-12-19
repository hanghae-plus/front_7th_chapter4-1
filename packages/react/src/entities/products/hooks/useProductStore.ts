import { useStore } from "@hanghae-plus/lib";
import { productStore, initialProductState } from "../productStore";
import { isSSR, getSSRData } from "../../../router/ssrContext";

// SSR 환경에서 사용할 상태 생성 함수
const getSSRProductState = () => {
  const ssrData = getSSRData();
  if (ssrData) {
    return {
      ...initialProductState,
      products: ssrData.products ?? [],
      categories: ssrData.categories ?? {},
      totalCount: ssrData.totalCount ?? 0,
      currentProduct: ssrData.product ?? null,
      relatedProducts: ssrData.relatedProducts ?? [],
      loading: false,
      status: "done" as const,
    };
  }
  return initialProductState;
};

export const useProductStore = () => {
  // 서버 환경 체크는 모듈 레벨에서 고정된 값
  const serverSide = isSSR();

  // CSR에서만 useStore 호출 (조건부지만 serverSide는 렌더링 간 변경되지 않음)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clientState = serverSide ? null : useStore(productStore);

  // SSR 환경에서는 SSR Context 데이터 직접 반환
  if (serverSide) {
    return getSSRProductState();
  }

  return clientState!;
};
