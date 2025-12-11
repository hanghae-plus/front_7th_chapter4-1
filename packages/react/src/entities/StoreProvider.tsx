import { createContext, memo, type PropsWithChildren, useContext, useMemo } from "react";
import type { createStores } from "./createStores";

type Stores = ReturnType<typeof createStores>;

export const StoreContext = createContext<null | Stores>(null);

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("StoreContext.Provider is not found");
  }
  return context;
};

export const StoreProvider = memo(
  ({ productStore, cartStore, children }: PropsWithChildren<ReturnType<typeof createStores>>) => {
    const stores = useMemo(() => ({ productStore, cartStore }), [productStore, cartStore]);
    return <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>;
  },
);

StoreProvider.displayName = "StoreProvider";
