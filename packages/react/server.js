import express from "express";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5176;

const app = express();

// 개발 환경: Vite 미들웨어 설정
let vite;
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  // Vite 미들웨어는 정적 파일 요청만 처리하도록
  app.use((req, res, next) => {
    // SSR이 필요한 경로는 제외하고 Vite 미들웨어에 전달
    if (req.path.startsWith("/src/") || req.path.startsWith("/@") || req.path.includes(".")) {
      vite.middlewares(req, res, next);
    } else {
      next();
    }
  });
}

// base 경로 설정 (프로덕션 환경에서만 사용)
const base = prod ? "/front_7th_chapter4-1/react" : "";

// 프로덕션 환경: 정적 파일 서빙 (base 경로 고려, SSR 라우트 전에 처리)
if (prod) {
  // 정적 파일은 확장자가 있는 경우만 처리하도록 (SSR 라우트와 충돌 방지)
  app.use(base, (req, res, next) => {
    // 확장자가 있는 파일 요청만 정적 파일로 처리
    const hasExtension = req.path.includes(".") && !req.path.endsWith("/");
    if (hasExtension) {
      express.static("dist/react")(req, res, next);
    } else {
      next(); // SSR 라우트로 전달
    }
  });
}

// 템플릿 경로 설정 (개발/프로덕션 분기)
const templatePath = prod ? path.resolve("dist/react/index.html") : path.resolve("index.html");

// 템플릿 읽기 (프로덕션 환경에서만 미리 읽기)
let template = "";
if (prod) {
  template = fs.readFileSync(templatePath, "utf-8");
}

// SSR 라우트 (모든 경로 처리)
app.use(async (req, res) => {
  try {
    // render 함수 로드 (환경에 따라 다르게 처리)
    let render;
    if (prod) {
      // 프로덕션: 빌드된 모듈 import
      // Windows 환경에서는 절대 경로를 file:// URL로 변환해야 할 수 있음
      const serverModulePath = path.resolve("./dist/react-ssr/main-server.js");
      // Windows 환경 체크: 절대 경로가 드라이브 문자로 시작하면 file:// URL로 변환
      const serverModuleUrl =
        process.platform === "win32" && path.isAbsolute(serverModulePath)
          ? pathToFileURL(serverModulePath).href
          : "./dist/react-ssr/main-server.js";
      const { render: renderFn } = await import(serverModuleUrl);
      render = renderFn;
    } else {
      // 개발: Vite를 통해 모듈 로드
      const { render: renderFn } = await vite.ssrLoadModule("/src/main-server.tsx");
      render = renderFn;
    }

    // URL에서 base 경로 제거
    let url = req.originalUrl;
    if (base) {
      // base 경로로 시작하는지 확인 (끝 슬래시 고려)
      if (url.startsWith(base + "/")) {
        url = url.slice(base.length);
      } else if (url === base || url === base + "/") {
        url = "/";
      } else if (url.startsWith(base)) {
        url = url.slice(base.length);
      } else {
        // base 경로로 시작하지 않으면 그대로 사용 (개발 환경 등)
        // 하지만 프로덕션에서는 base가 필수이므로 루트로 처리
        url = "/";
      }
    }

    // 빈 문자열이면 루트로
    if (!url || url === "") {
      url = "/";
    }

    // 쿼리 문자열 분리
    const pathname = url.split("?")[0] || "/";

    // 서버 렌더링 실행 (쿼리 파라미터는 Express에서 자동으로 파싱됨)
    const { html: appHtml, head: appHead, initialData } = await render(pathname, req.query);

    // 템플릿 읽기 (환경에 따라 다르게 처리)
    let templateHtml;
    if (prod) {
      // 프로덕션: 미리 읽은 템플릿 사용
      templateHtml = template;
    } else {
      // 개발: Vite를 통해 템플릿 읽기
      templateHtml = await vite.transformIndexHtml(req.url, fs.readFileSync(path.resolve("index.html"), "utf-8"));
    }

    // 초기 데이터 스크립트 생성 (Hydration용)
    // XSS 방지: </script> 태그를 이스케이프 처리
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};</script>`
      : "";

    // HTML 문자열 치환
    // <!--app-html-->: 서버에서 렌더링한 HTML이 들어갈 자리
    // <!--app-head-->: SEO 메타태그, 초기 데이터 스크립트 등이 들어갈 자리
    const finalHtml = templateHtml
      .replace("<!--app-html-->", appHtml)
      .replace("<!--app-head-->", appHead)
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
  } catch (error) {
    // 모든 환경에서 콘솔에 상세 에러 출력
    console.error("SSR Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);

    // 개발 환경에서는 상세 에러 정보 표시 (디버깅용)
    if (!prod) {
      res.status(500).send(`
        <html>
          <head><title>SSR Error</title></head>
          <body>
            <h1>SSR Error</h1>
            <pre>${error.stack || error.message}</pre>
          </body>
        </html>
      `);
    } else {
      // 프로덕션 환경에서는 보안을 위해 간단한 에러 메시지만 표시
      // 디버깅을 위해 콘솔에는 상세 정보 출력 (위에서 이미 출력)
      res.status(500).send("Internal Server Error");
    }
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server running at http://localhost:${port}`);
});
