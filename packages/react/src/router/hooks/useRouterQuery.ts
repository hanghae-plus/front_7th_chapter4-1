import { useRouter } from "@hanghae-plus/lib";
import { useRouterContext } from "./useRouterContext";

/**
 * 라우터 쿼리 파라미터를 가져오는 커스텀 훅
 *
 * RouterContext에서 라우터를 가져와서 현재 URL의 쿼리 파라미터를 반환함
 * 쿼리 파라미터가 변경되면 자동으로 리렌더링됨
 *
 * @returns 현재 URL의 쿼리 파라미터 객체
 */
export const useRouterQuery = () => {
  const router = useRouterContext();
  // 라우터에서 query만 선택하여 반환
  return useRouter(router, ({ query }) => query);
};
