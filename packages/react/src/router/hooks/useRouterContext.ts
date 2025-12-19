import type { RouterInstance } from "@hanghae-plus/lib";
import { createContext, useContext, type FC } from "react";

/**
 * Router Context
 *
 * 라우터 인스턴스를 전역적으로 공유하기 위한 React Context
 * RouterProvider로 감싸진 컴포넌트에서만 사용 가능
 */
export const RouterContext = createContext<RouterInstance<FC> | null>(null);

/**
 * Router Context를 사용하기 위한 커스텀 훅
 *
 * RouterProvider로 감싸지 않은 컴포넌트에서 호출하면 에러 발생
 *
 * @returns 라우터 인스턴스
 * @throws {Error} RouterProvider로 감싸지 않은 경우 에러 발생
 */
export const useRouterContext = () => {
  const router = useContext(RouterContext);

  // RouterProvider로 감싸지 않은 경우 에러 발생
  if (!router) {
    throw new Error("Router context not found");
  }

  return router;
};
