import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5176;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

const app = express();

// 빌드된 render 함수 import
const { render } = await import("./dist/react-ssr/main-server.js");

// HTML 템플릿 읽기
const template = fs.readFileSync(path.resolve(__dirname, prod ? "./dist/react/index.html" : "./index.html"), "utf-8");

app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "/");
    const query = req.query;

    // App 렌더링
    const appHtml = await render(url, query);

    // 템플릿에 삽입
    const html = template.replace("<!--app-html-->", appHtml);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    console.error("SSR Error:", e);
    res.status(500).send(e.message);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
