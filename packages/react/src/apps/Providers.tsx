import { StoreProvider } from "../entities";
import { RouterProvider } from "../router";
import { type ComponentProps, memo, type PropsWithChildren } from "react";

type Props = PropsWithChildren<
  Omit<ComponentProps<typeof StoreProvider> & ComponentProps<typeof RouterProvider>, "children">
>;

export const Providers = memo(({ cartStore, productStore, router, children }: Props) => {
  return (
    <StoreProvider cartStore={cartStore} productStore={productStore}>
      <RouterProvider router={router}>{children}</RouterProvider>
    </StoreProvider>
  );
});

Providers.displayName = "Providers";
