import test from "@playwright/test";
import { createCSRTest, createSSGTest, createSSRTest } from "./createTests";

// 환경 변수로 특정 환경만 테스트할 수 있도록 설정
const TEST_ENV = process.env.TEST_ENV; // 'csr', 'ssr', 'ssg', 또는 undefined (모두)

test.describe("E2E Test > 심화과제 (React)", () => {
  // CSR 테스트
  if (!TEST_ENV || TEST_ENV === "csr") {
    createCSRTest(`http://localhost:5175/`);
    createCSRTest(`http://localhost:4175/front_7th_chapter4-1/react/`);
  }

  // SSR 테스트
  if (!TEST_ENV || TEST_ENV === "ssr") {
    createSSRTest(`http://localhost:5176/`);
    createSSRTest(`http://localhost:4176/front_7th_chapter4-1/react/`);
  }

  // SSG 테스트
  if (!TEST_ENV || TEST_ENV === "ssg") {
    createSSGTest(`http://localhost:4179/front_7th_chapter4-1/react/`);
  }
});
