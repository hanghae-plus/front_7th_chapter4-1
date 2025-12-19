import type { RouterInstance } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { createContext, useContext } from "react";

export const RouterContext = createContext<RouterInstance<FunctionComponent> | null>(null);

export const useRouterContext = () => {
  const router = useContext(RouterContext);
  if (!router) throw new Error("useRouterContext must be used within RouterContext.Provider");
  return router;
};
