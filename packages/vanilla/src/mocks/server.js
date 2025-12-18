import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MSW Node.js 서버 설정 (SSR/SSG 환경용)
export const server = setupServer(...handlers);
