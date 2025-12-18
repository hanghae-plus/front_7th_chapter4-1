// 글로벌 라우터 인스턴스
import { Router, MemoryRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FC } from "react";

// Universal Router: 서버와 클라이언트 환경에서 모두 작동
// 서버에서는 baseUrl 없이 라우팅 (SSR/SSG는 절대 경로로 처리)
const isServer = typeof window === "undefined";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteComponent = FC<any>;

export const router = isServer ? new MemoryRouter<RouteComponent>("") : new Router<RouteComponent>(BASE_URL);
