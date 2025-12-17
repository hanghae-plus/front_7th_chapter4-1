import { useRouter, Router } from "@hanghae-plus/lib";
import { router } from "../createRouter";
import type { FunctionComponent } from "react";

export const useRouterQuery = () => {
  // Hooks only run on client, so router is always Router (not ServerRouter)
  return useRouter(router as Router<FunctionComponent>, ({ query }) => query);
};
