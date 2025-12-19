export const isServer = () => {
  return typeof window === "undefined";
};

export function parseSSRQuery(url) {
  const searchParams = new URL(url, "http://localhost").searchParams;
  const query = {};
  for (const [key, value] of searchParams) {
    query[key] = value;
  }
  return query;
}
