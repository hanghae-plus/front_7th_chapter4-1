import { router } from "../createRouter";
import { useRouter, Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

export const useCurrentPage = () => {
  // Hooks only run on client, so router is always Router (not ServerRouter)
  return useRouter(router as Router<FunctionComponent>, ({ target }) => target);
};
