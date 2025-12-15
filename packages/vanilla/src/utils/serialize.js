/**
 * HTML 안전 직렬화
 * - </script> 안전 이스케이프, U+2028/U+2029 제거 등 XSS 최소화
 */
export function safeSerialize(data) {
  const json = JSON.stringify(data);
  return json
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
