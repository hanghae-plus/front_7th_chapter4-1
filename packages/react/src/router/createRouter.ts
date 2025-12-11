import { isServer } from "../utils";
import { MemoryRouter, Router, type RouterInstance } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { BASE_URL } from "../constants";

export const createRouter = () => {
  const CurrentRouter = isServer() ? MemoryRouter : Router;

  return new CurrentRouter<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FunctionComponent & { getServerProps: (router: RouterInstance) => Promise<Record<string, any> & { head: string }> }
  >(BASE_URL);
};
