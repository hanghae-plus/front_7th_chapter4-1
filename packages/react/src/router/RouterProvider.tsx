import { createContext, memo, type PropsWithChildren, useContext } from "react";
import type { createRouter } from "./createRouter";

type Router = ReturnType<typeof createRouter>;

export const RouterContext = createContext<null | Router>(null);

export const useRouterContext = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("RouterContext.Provider is not found");
  }
  return context;
};

export const RouterProvider = memo(({ router, children }: PropsWithChildren<{ router: Router }>) => {
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
});

RouterProvider.displayName = "RouterProvider";
