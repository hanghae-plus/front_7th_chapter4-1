import { useRouter } from "@hanghae-plus/lib";
import { useRouterContext } from "./useRouterContext";

/**
 * 경로 파라미터 타입
 * 예: /product/:id 경로에서 id 값
 */
type Params = Record<string, string | undefined>;

/**
 * 기본 셀렉터 함수
 * 파라미터를 그대로 반환하거나 타입 변환만 수행
 */
const defaultSelector = <S>(params: Params) => params as S;

/**
 * 라우터 경로 파라미터를 가져오는 커스텀 훅
 *
 * RouterContext에서 라우터를 가져와서 현재 라우트의 경로 파라미터를 반환함
 * 파라미터가 변경되면 자동으로 리렌더링됨
 *
 * @template S - 셀렉터가 반환하는 타입 (기본값은 Params)
 *
 * @param selector - 파라미터에서 필요한 부분만 선택하는 함수 (옵션)
 *
 * @returns 셀렉터가 반환한 값 (기본값은 전체 파라미터 객체)
 */
export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  const router = useRouterContext();
  // 라우터에서 params만 선택하여 셀렉터에 전달
  return useRouter(router, ({ params }) => selector(params));
};
