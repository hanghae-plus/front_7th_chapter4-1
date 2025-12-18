#!/usr/bin/env node

/**
 * 여러 서버 포트가 모두 준비될 때까지 기다리는 스크립트
 * concurrently로 실행된 모든 서버가 준비되면 종료
 */

import { spawn } from "child_process";
import http from "http";

const PORTS = [5173, 5174, 4173, 4174, 4178]; // Vanilla 서버 포트들
const CHECK_INTERVAL = 1000; // 1초마다 체크
const MAX_WAIT_TIME = 120000; // 최대 2분 대기

/**
 * 특정 포트가 준비되었는지 확인
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path: "/",
        method: "HEAD",
        timeout: 2000,
      },
      (res) => {
        resolve(true);
      },
    );

    req.on("error", () => {
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * 모든 포트가 준비되었는지 확인
 */
async function checkAllPorts() {
  const results = await Promise.all(PORTS.map((port) => checkPort(port)));
  return results.every((ready) => ready);
}

/**
 * 서버 시작
 */
function startServers() {
  const child = spawn("pnpm", ["run", "serve:test"], {
    stdio: "inherit",
    shell: true,
  });

  return child;
}

/**
 * 메인 함수
 */
async function main() {
  console.log("서버들을 시작합니다...");
  const serverProcess = startServers();

  const startTime = Date.now();

  console.log(`다음 포트들이 준비될 때까지 기다립니다: ${PORTS.join(", ")}`);

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    const allReady = await checkAllPorts();

    if (allReady) {
      console.log("모든 서버가 준비되었습니다!");
      // 프로세스는 계속 실행되도록 유지
      // Playwright가 종료할 때까지 대기
      process.on("SIGTERM", () => {
        serverProcess.kill("SIGTERM");
        process.exit(0);
      });
      process.on("SIGINT", () => {
        serverProcess.kill("SIGINT");
        process.exit(0);
      });
      // 무한 대기 (Playwright가 프로세스를 종료할 때까지)
      await new Promise(() => {}); // 절대 resolve되지 않는 Promise
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }

  console.error("타임아웃: 일부 서버가 준비되지 않았습니다.");
  serverProcess.kill("SIGTERM");
  process.exit(1);
}

main().catch((error) => {
  console.error("에러 발생:", error);
  process.exit(1);
});
