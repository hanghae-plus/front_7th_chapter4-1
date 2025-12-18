import { useRouter } from "@hanghae-plus/lib";
import { useRouterContext } from "./useRouterContext";

/**
 * 현재 페이지 컴포넌트를 가져오는 커스텀 훅
 *
 * RouterContext에서 라우터를 가져와서 현재 매칭된 라우트의 핸들러 컴포넌트를 반환함
 * 라우트가 변경되면 자동으로 리렌더링됨
 *
 * @returns 현재 페이지 컴포넌트 (매칭된 라우트가 없으면 undefined)
 */
export const useCurrentPage = () => {
  const router = useRouterContext();
  // 라우터에서 target(핸들러 컴포넌트)만 선택하여 반환
  return useRouter(router, ({ target }) => target);
};
