import { createContext, useContext, type ReactNode } from "react";
import type { StringRecord } from "@hanghae-plus/lib";

interface QueryContextType {
  query: StringRecord;
  updateQuery: (newQuery: StringRecord) => void;
}

export const QueryContext = createContext<QueryContextType | null>(null);

interface QueryProviderProps {
  children: ReactNode;
  initialQuery?: StringRecord;
}

export function QueryProvider({ children, initialQuery = {} }: QueryProviderProps) {
  const updateQuery = (newQuery: StringRecord) => {
    // 클라이언트에서만 URL 업데이트
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      Object.entries(newQuery).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, String(value));
        }
      });
      window.history.pushState(null, "", url.toString());
      // 라우터에게 변경 알림
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return <QueryContext.Provider value={{ query: initialQuery, updateQuery }}>{children}</QueryContext.Provider>;
}

export function useQueryContext(): QueryContextType {
  const context = useContext(QueryContext);
  if (!context) {
    // Context가 없으면 기본값 반환 (CSR에서 Provider 없이 사용 가능하도록)
    return {
      query: {} as StringRecord,
      updateQuery: (newQuery: StringRecord) => {
        if (typeof window !== "undefined") {
          const currentParams = new URLSearchParams(window.location.search);
          Object.entries(newQuery).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
              currentParams.delete(key);
            } else {
              currentParams.set(key, String(value));
            }
          });
          const queryString = currentParams.toString();
          const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
          window.history.pushState(null, "", newUrl);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      },
    };
  }
  return context;
}
