/**
 * SSR 라우터 컨텍스트
 *
 * SSR에서는 window.location을 사용할 수 없으므로,
 * 서버에서 매칭된 라우트 정보를 React Context로 전달합니다.
 *
 * CSR에서는 이 컨텍스트가 null이므로 기존 클라이언트 라우터를 사용합니다.
 */
import { createContext, useContext, type FunctionComponent, type ReactNode } from "react";

// 스토어 인터페이스 (lib의 createStore 반환 타입과 호환)
interface Store {
  getState: () => unknown;
  dispatch: (action: unknown) => void;
  subscribe: (listener: () => void) => () => void;
}

interface SSRRouteInfo {
  handler: FunctionComponent;
  params: Record<string, string>;
  path: string;
  query: Record<string, string>;
}

interface SSRContextValue {
  route: SSRRouteInfo | null;
  store: Store | null;
}

// SSR에서 매칭된 라우트 정보와 스토어를 담는 컨텍스트
export const SSRRouterContext = createContext<SSRContextValue>({ route: null, store: null });

interface SSRRouterProviderProps {
  route: SSRRouteInfo | null;
  store?: Store | null;
  children: ReactNode;
}

/**
 * SSR 라우터 프로바이더
 * main-server.tsx에서 사용
 */
export const SSRRouterProvider = ({ route, store = null, children }: SSRRouterProviderProps) => {
  return <SSRRouterContext.Provider value={{ route, store }}>{children}</SSRRouterContext.Provider>;
};

/**
 * SSR 라우트 정보를 가져오는 훅
 * SSR 환경이면 컨텍스트에서, 아니면 null 반환
 */
export const useSSRRoute = () => {
  const { route } = useContext(SSRRouterContext);
  return route;
};

/**
 * SSR 쿼리 파라미터를 가져오는 훅
 * SSR 환경이면 컨텍스트에서, 아니면 null 반환
 */
export const useSSRQuery = () => {
  const { route } = useContext(SSRRouterContext);
  return route?.query ?? null;
};

/**
 * SSR 스토어를 가져오는 훅
 * SSR 환경이면 컨텍스트에서, 아니면 null 반환
 */
export const useSSRStore = () => {
  const { store } = useContext(SSRRouterContext);
  return store;
};
