export const isNearBottom = (threshold = 200) => {
  if (typeof window === "undefined") return false;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  return scrollTop + windowHeight >= documentHeight - threshold;
};

export const withEscKey = (handler: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    handler(e);
  }
};
