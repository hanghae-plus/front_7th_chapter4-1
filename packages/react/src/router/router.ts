// 글로벌 라우터 인스턴스
import { Router, createBrowserRuntime } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const runtime = createBrowserRuntime(BASE_URL);
export const router = new Router<FunctionComponent>(runtime, BASE_URL);
