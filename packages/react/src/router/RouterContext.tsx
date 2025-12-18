import { createContext, useContext, type ReactNode } from "react";
import type { StringRecord } from "../types";

interface RouterContextValue {
  query: StringRecord;
  params: StringRecord;
}

const RouterContext = createContext<RouterContextValue | null>(null);

interface RouterProviderProps {
  children: ReactNode;
  query?: StringRecord;
  params?: StringRecord;
}

export function RouterProvider({ children, query = {}, params = {} }: RouterProviderProps) {
  return <RouterContext.Provider value={{ query, params }}>{children}</RouterContext.Provider>;
}

export function useServerRouterContext(): RouterContextValue | null {
  return useContext(RouterContext);
}
