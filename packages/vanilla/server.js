import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

let vite;

// 개발 환경: Vite 미들웨어 통합
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: {
      middlewareMode: true,
    },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: 정적 파일 미들웨어 생성
  const staticMiddleware = express.static(path.resolve(__dirname, "../../dist/vanilla"), {
    index: false, // 자동 index.html 반환 비활성화
    fallthrough: true,
  });

  // 조건부 정적 파일 서빙
  app.use(base, (req, res, next) => {
    const normalizedPath = req.path.replace(new RegExp(`^${base}`), "/");

    // 루트 경로에 쿼리 파라미터가 있으면 SSR로 넘김
    if (normalizedPath === "/" && Object.keys(req.query).length > 0) {
      return next();
    }

    // 루트 경로이고 쿼리가 없으면 index.html 반환
    if (normalizedPath === "/") {
      return res.sendFile(path.resolve(__dirname, "../../dist/vanilla/index.html"));
    }

    // 그 외의 경우는 정적 파일 서빙
    staticMiddleware(req, res, next);
  });
}

// SSR 핸들러 (정규식 사용)
app.get(/.*/, async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    // req.query는 [Object: null prototype]이므로 일반 객체로 변환
    const query = { ...req.query };

    let template;
    let render;

    if (prod) {
      // === 프로덕션 ===
      // SSR용 템플릿 (플레이스홀더 보존된 파일)
      template = fs.readFileSync(path.resolve(__dirname, "../../dist/vanilla/template.html"), "utf-8");
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    } else {
      // === 개발 환경 ===
      // 1) index.html 읽기
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

      // 2) Vite가 HTML 변환 (HMR 클라이언트 주입 등)
      template = await vite.transformIndexHtml(url, template);

      // 3) 서버 렌더 함수를 Vite로 로드 (캐시 없이 항상 최신)
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    }

    // 앱 렌더링
    const { html: appHtml, state, meta } = await render(url, query);

    // 초기 상태를 스크립트로 주입 (XSS 방지)
    const stateScript = `
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(state).replace(/</g, "\\u003c")}
      </script>
    `;

    // HTML 조립
    let html = template.replace("<!--app-html-->", appHtml).replace("<!--app-head-->", stateScript);

    // 메타 태그 주입
    if (meta) {
      html = html.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`);
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${meta.description}" />`,
      );
    }

    // 응답
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (error) {
    // 에러 처리
    if (!prod && vite) {
      // Vite가 스택 트레이스 수정 (원본 소스 위치 표시)
      vite.ssrFixStacktrace(error);
    }
    console.error("SSR Error:", error.stack);
    res.status(500).end(error.stack);
  }
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
