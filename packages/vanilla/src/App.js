import { RouterContext, StoreContext } from "./contexts";
import { NotFoundPage } from "./pages";
import { callOnce } from "./utils/callOnce";
import { useAllEvents } from "./events";
import { useCartService } from "./services";

const setup = callOnce(() => {
  const cartService = useCartService();
  useAllEvents();
  cartService.loadCartFromStorage();
});

export const App = ({ stores, router }) => {
  return StoreContext.Provider(stores, () =>
    RouterContext.Provider(router, () => {
      setup();
      const PageComponent = router.target;
      return PageComponent ? PageComponent() : NotFoundPage();
    }),
  );
};
