import { renderToString } from "react-dom/server";
import { App } from "./App";
// import { router } from "./router";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const render = async (url: string, query: Record<string, string>) => {
  return { html: renderToString(<App />) };
};
