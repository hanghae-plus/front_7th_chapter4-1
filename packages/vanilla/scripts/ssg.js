import { generateStaticSite } from "../static-site-generate.js";

const SSG_ROUTES = [
  "/404", // NotFoundPage
];

async function main() {
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
