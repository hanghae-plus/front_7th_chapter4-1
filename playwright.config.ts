import { defineConfig, devices } from "@playwright/test";

// 환경 변수로 특정 환경만 테스트할 수 있도록 설정
const TEST_ENV = process.env.TEST_ENV; // 'csr', 'ssr', 'ssg', 또는 undefined (모두)

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // 환경별로 순차 실행
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // 순차 실행을 위해 1로 설정
  reporter: process.env.CI ? "dot" : "html",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // 환경별로 webServer 설정
  webServer: TEST_ENV
    ? getWebServerForEnv(TEST_ENV)
    : {
        // 기본값: 모든 환경 시작
        command: "pnpm run serve:test",
        port: 4173,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120000, // 서버 시작 대기 시간 증가
      },
});

function getWebServerForEnv(env: string) {
  const configs: Record<string, { command: string; port: number }> = {
    csr: {
      command: "cd packages/react && pnpm run dev",
      port: 5175,
    },
    "csr-prod": {
      command: "cd packages/react && pnpm run preview:csr-with-build",
      port: 4175,
    },
    ssr: {
      command: "cd packages/react && pnpm run dev:ssr",
      port: 5176,
    },
    "ssr-prod": {
      command: "cd packages/react && pnpm run preview:ssr-with-build",
      port: 4176,
    },
    ssg: {
      command: "cd packages/react && pnpm run preview:ssg-with-build",
      port: 4179,
    },
  };

  const config = configs[env];
  if (!config) {
    throw new Error(`Unknown TEST_ENV: ${env}. Available: ${Object.keys(configs).join(", ")}`);
  }

  return {
    ...config,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe" as const,
    stderr: "pipe" as const,
    timeout: 120000,
  };
}
