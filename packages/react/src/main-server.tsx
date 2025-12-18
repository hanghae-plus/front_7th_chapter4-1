import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";

export const render = async (url: string, query: Record<string, string>) => {
  // SSR용 URL 설정
  router.setServerUrl(url, query);

  const html = renderToString(<App />);
  return html;
};
