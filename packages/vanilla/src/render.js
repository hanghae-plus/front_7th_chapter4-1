import { withBatch } from "./utils";
import { App } from "./App";

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch((props) => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  // App 컴포넌트 렌더링
  rootElement.innerHTML = App(props);
});

/**
 * 렌더링 초기화 - Store 변화 감지 설정
 */
export function initRender(props) {
  // 각 Store의 변화를 감지하여 자동 렌더링
  const renderApp = () => render(props);

  props.stores.productStore.subscribe(renderApp);
  props.stores.cartStore.subscribe(renderApp);
  props.stores.uiStore.subscribe(renderApp);
  props.router.subscribe(renderApp);
  props.router.start();
}
