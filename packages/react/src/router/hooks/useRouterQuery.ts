import { useRouter, type RouterInstance } from "@hanghae-plus/lib";
import { router } from "../router";
import { useContext } from "react";
import { QueryContext } from "../../contexts/QueryContext";
import type { StringRecord, AnyFunction } from "@hanghae-plus/lib";

export const useRouterQuery = (): StringRecord => {
  // Context를 안전하게 가져오기 (Provider 없어도 에러 안남)
  const contextValue = useContext(QueryContext);
  const routerQuery = useRouter(router as RouterInstance<AnyFunction>, ({ query }) => query);

  // SSR에서는 Context 사용, CSR에서는 라우터 사용
  if (typeof window === "undefined") {
    return (contextValue?.query as StringRecord) || {};
  }

  return routerQuery;
};
