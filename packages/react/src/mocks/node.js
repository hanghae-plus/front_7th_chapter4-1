import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MSW 워커 설정
export const mswServer = setupServer(...handlers);
