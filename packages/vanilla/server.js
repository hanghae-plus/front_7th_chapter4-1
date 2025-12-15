import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

async function createServer() {
  const app = express();

  let vite;
  let template;
  let render;

  if (!prod) {
    // TODO: 개발 환경 설정
    // 1. Vite 서버 생성 (middlewareMode: true, appType: "custom")
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    // 2. Express에 Vite 미들웨어 연결
    app.use(vite.middlewares);
  } else {
    // TODO: 프로덕션 환경 설정
    // 1. compression 미들웨어 적용
    const compression = (await import("compression")).default;
    app.use(compression());
    // 2. sirv로 정적 파일 서빙
    const sirv = (await import("sirv")).default;
    app.use(base, sirv("./dist/vanilla", { extensions: [] }));
    // 3. 템플릿과 render 함수 미리 로드
    template = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
    render = (await import("./dist/vanilla-ssr/main-server.js")).render;
  }

  app.use("*all", async (req, res) => {
    const url = req.originalUrl.replace(base, "");

    try {
      if (!prod) {
        // TODO: 개발 환경에서 매 요청마다
        // 1. index.html 읽기
        template = fs.readFileSync("./index.html", "utf-8");
        // 2. transformIndexHtml으로 변환
        template = await vite.transformIndexHtml(url, template);
        // 3. ssrLoadModule로 render 함수 로드
        render = (await vite.ssrLoadModule("/src/main-server.js")).render;
      }

      // TODO: render 함수 호출하여 { html, head, initialData } 받기
      const rendered = await render(url);

      // TODO: __INITIAL_DATA__ 스크립트 생성
      const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData ?? {})}</script>`;

      // TODO: 템플릿 치환
      // - <!--app-head--> → head
      // - <!--app-html--> → html
      // - </head> 앞에 initialDataScript 삽입
      const html = template
        .replace(`<!--app-head-->`, rendered.head ?? "")
        .replace(`<!--app-html-->`, rendered.html ?? "")
        .replace("</head>", `${initialDataScript}</head>`);

      // TODO: 응답 전송
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      // TODO: 에러 처리 (개발환경에서는 vite.ssrFixStacktrace 호출)
      vite?.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
