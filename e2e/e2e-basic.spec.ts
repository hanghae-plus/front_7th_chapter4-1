import test from "@playwright/test";
import { createCSRTest, createSSGTest, createSSRTest } from "./createTests";

test.describe("E2E Test > 기본과제 (Vanilla Javascript)", () => {
  createCSRTest(`http://localhost:5173/`);
  createCSRTest(`http://localhost:4173/front_7th_chapter4-1/vanilla/`);
  createSSRTest(`http://localhost:5174/`);
  createSSRTest(`http://localhost:4174/front_7th_chapter4-1/vanilla/`);
  createSSGTest(`http://localhost:4178/front_7th_chapter4-1/vanilla/`);
});
