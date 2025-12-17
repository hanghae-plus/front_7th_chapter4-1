import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// MSW 워커 설정
export const server = setupServer(...handlers);
