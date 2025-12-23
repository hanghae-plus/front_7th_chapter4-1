import { Router, createBrowserRuntime, createServerRuntime } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const createRuntime = () => {
  if (typeof window === "undefined") {
    return createServerRuntime("/");
  }
  return createBrowserRuntime(BASE_URL);
};

const runtime = createRuntime();
export const router = new Router<FunctionComponent>(runtime, BASE_URL);
