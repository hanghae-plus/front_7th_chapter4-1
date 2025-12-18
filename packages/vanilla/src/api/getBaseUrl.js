const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return ""; // 브라우저: 상대 경로
  }

  const port = process.env.PORT || 5173;

  return `http://localhost:${port}`; // SSR: 절대 경로 (MSW가 매칭)
};

export default getBaseUrl;
