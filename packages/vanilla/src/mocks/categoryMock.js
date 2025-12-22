import { delay } from "./utils.js";
import items from "./items.json" with { type: "json" };

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

export async function getCategoriesMock() {
  const categories = getUniqueCategories();
  await delay();
  return categories;
}
