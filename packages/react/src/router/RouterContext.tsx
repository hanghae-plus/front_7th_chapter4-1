import type { RouterInstance } from "@hanghae-plus/lib";
import type { FC } from "react";
import { RouterContext } from "./hooks/useRouterContext";

/**
 * RouterProvider의 props 타입
 */
interface RouterProviderProps {
  /** 라우터 인스턴스 */
  router: RouterInstance<FC>;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * RouterProvider 컴포넌트
 *
 * Context API를 통해 라우터 인스턴스를 하위 컴포넌트에 제공함
 * 하위 컴포넌트에서는 useRouterContext 훅을 사용하여 라우터에 접근할 수 있음
 */
export const RouterProvider = ({ children, router }: RouterProviderProps) => {
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
};
