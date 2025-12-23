import { generateStaticSite } from "../static-site-generate.js";

import { server as mswServer } from "../src/mocks/node.js";
mswServer.listen({ onUnhandledRequest: "bypass" });

async function getProductIds() {
  const response = await fetch("http://localhost:5173/api/products?limit=20");
  const data = await response.json();
  return data.products.map((p) => p.productId);
}

async function main() {
  const productIds = await getProductIds();

  const SSG_ROUTES = [
    "/", // HomePage
    "/404", // NotFoundPage
    ...productIds.map((id) => `/product/${id}/`),
  ];

  const results = await Promise.allSettled(SSG_ROUTES.map((route) => generateStaticSite(route)));

  const succeeded = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  if (failed.length > 0) {
    console.error(`Failed to generate ${failed.length} pages:`);
    failed.forEach((r) => console.error(`  - ${r.reason}`));
    process.exit(1);
  }

  console.log(`SSG completed: ${succeeded.length} pages generated`);
}

main();
