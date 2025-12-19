import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.js";

// MSW 워커 설정
export const worker = setupWorker(...handlers);
