import test from "@playwright/test";
import { createCSRTest, createSSGTest, createSSRTest } from "./createTests";

test.describe("E2E Test > 심화과제 (React)", () => {
  createCSRTest(`http://localhost:5175/`);
  createCSRTest(`http://localhost:4175/front_7th_chapter4-1/react/`);
  createSSRTest(`http://localhost:5176/`);
  createSSRTest(`http://localhost:4176/front_7th_chapter4-1/react/`);
  createSSGTest(`http://localhost:4179/front_7th_chapter4-1/react/`);
});
