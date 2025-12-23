import fs from "fs";
import path from "path";

import { render } from "./dist/vanilla-ssr/main-server.js";

const DIST_DIR = "../../dist/vanilla";

export async function generateStaticSite(url) {
  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

  const appHtml = await render(url);

  let fileName;
  if (url === "/") {
    fileName = "/index";
  } else if (url.endsWith("/")) {
    fileName = `${url}index`;
  } else {
    fileName = url;
  }
  const outputPath = path.join(DIST_DIR, `${fileName}.html`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const result = template
    .replace("<!--app-html-->", appHtml.html)
    .replace("<!--app-head-->", appHtml.head)
    .replace("</head>", `${appHtml.initialDataScript ?? ""}</head>`);

  fs.writeFileSync(outputPath, result);
  console.log(`Generated static site: ${outputPath}`);
}
