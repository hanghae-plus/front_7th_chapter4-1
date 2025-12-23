import { Router, createBrowserRuntime, createServerRuntime } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const isServer = typeof window === "undefined";

// Browser: singleton router with browser runtime
// Server: singleton router that gets synced per-request
const browserRouter = isServer ? null : new Router<FunctionComponent>(createBrowserRuntime(BASE_URL), BASE_URL);
const serverRouter = isServer ? new Router<FunctionComponent>(createServerRuntime("/"), "") : null;

/**
 * Creates a fresh router instance for SSR.
 * Each request gets its own router to avoid state pollution between concurrent requests.
 */
export function createSSRRouter(url: string): Router<FunctionComponent> {
  const runtime = createServerRuntime(url);
  return new Router<FunctionComponent>(runtime, "");
}

/**
 * Syncs the server-side singleton router with the request URL.
 * Must be called before rendering to ensure hooks get correct query/params.
 */
export function syncServerRouter(url: string): void {
  if (serverRouter) {
    serverRouter.sync(url);
  }
}

/**
 * Router singleton used by hooks.
 * - Browser: persistent singleton with browser runtime
 * - Server: singleton that gets synced per-request via syncServerRouter
 */
export const router: Router<FunctionComponent> = browserRouter ?? serverRouter!;
