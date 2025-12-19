import fs from "fs";
import { mswServer } from "./src/mocks/node.js";

mswServer.listen({
  onUnhandledRequest: "warn",
});

const DIST_DIR = "../../dist/react";
const SSR_DIR = "./dist/react-ssr";

async function generateStaticSite() {
  const template = await fs.promises.readFile(`./dist/react/index.html`, "utf-8");
  const { render } = await import(`${SSR_DIR}/main-server.js`);

  const pages = await getPages();

  for (const page of pages) {
    const { html, head, initialData } = await render(`${page.url}`);
    const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`;
    const result = template
      .replace("<!--app-html-->", html)
      .replace("<!--app-head-->", head)
      .replace("</head>", `${initialDataScript}</head>`);

    const dir = page.filePath.split("/").slice(0, -1).join("/");
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.writeFileSync(page.filePath, result);
  }
}

async function getPages() {
  const { getProducts } = await import(`${SSR_DIR}/main-server.js`);
  const { products } = await getProducts({ limit: 20 });

  return [
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    { url: "/404", filePath: `${DIST_DIR}/404.html` },
    ...products.map(({ productId }) => ({
      url: `/product/${productId}/`,
      filePath: `${DIST_DIR}/product/${productId}/index.html`,
    })),
  ];
}

await generateStaticSite();

mswServer.close();
