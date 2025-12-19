import fs from "fs";
import path from "path";

async function generateStaticSite() {
  const { render } = await import("./dist/vanilla-ssr/main-server.js");
  const template = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
  const products = JSON.parse(fs.readFileSync("./src/mocks/items.json", "utf-8"));
  const pages = [{ url: "/", filePath: "../../dist/vanilla/index.html" }];

  products.forEach((product) =>
    pages.push({
      url: `/product/${product.productId}/`,
      filePath: `../../dist/vanilla/product/${product.productId}/index.html`,
    }),
  );

  for (const page of pages) {
    const { html, head, data } = await render(page.url, {});

    const result = template
      .replace(`<!--app-head-->`, head ?? "")
      .replace(`<!--app-html-->`, html ?? "")
      .replace(`<!--app-data-->`, data ?? "");

    const dir = path.dirname(page.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(page.filePath, result);
  }
}

generateStaticSite().catch((error) => {
  console.error("SSG 실패", error);
  process.exit(1);
});
