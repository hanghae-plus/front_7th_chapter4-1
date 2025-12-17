import { router } from "../createRouter";
import { useRouter, Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

type Params = Record<string, string | undefined>;

const defaultSelector = <S>(params: Params) => params as S;

export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  // Hooks only run on client, so router is always Router (not ServerRouter)
  return useRouter(router as Router<FunctionComponent>, ({ params }) => selector(params));
};
