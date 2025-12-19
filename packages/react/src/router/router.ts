// 글로벌 라우터 인스턴스
import { Router, ServerRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

export type RouterType = ReturnType<typeof createRouter>;

export const createRouter = (routes: Record<string, FunctionComponent>) => {
  const router =
    typeof window !== "undefined" ? new Router<FunctionComponent>(BASE_URL) : new ServerRouter<FunctionComponent>();

  for (const [path, component] of Object.entries(routes)) {
    router.addRoute(path, component);
  }

  return router;
};
