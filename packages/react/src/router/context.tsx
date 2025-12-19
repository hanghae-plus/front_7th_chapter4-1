import { createContext, useContext, useSyncExternalStore, type ReactNode, type FunctionComponent } from "react";
import { ClientRouter } from "./ClientRouter";
import { ServerRouter } from "./ServerRouter";

type ApplicationRouter = ClientRouter<FunctionComponent> | ServerRouter<FunctionComponent>;

const RouterContext = createContext<ApplicationRouter | null>(null);

interface RouterProviderProps {
  router: ApplicationRouter;
  children: ReactNode;
}

export const RouterProvider = ({ router, children }: RouterProviderProps): ReactNode => {
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRouter = <T extends FunctionComponent>(): ClientRouter<T> | ServerRouter<T> => {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error("useRouter must be used within a RouterProvider");
  }

  // ✅ route와 query 모두 구독하여 변경 감지
  useSyncExternalStore(
    (callback) => router.subscribe(callback),
    () => JSON.stringify({ route: router.route, query: router.query }),
    () => JSON.stringify({ route: router.route, query: router.query }),
  );

  return router as ClientRouter<T> | ServerRouter<T>;
};
