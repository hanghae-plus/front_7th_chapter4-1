const contextStacks = new Map();

export function createContext(defaultValue = null) {
  const symbol = Symbol("context");

  return {
    Provider: (value, fn) => {
      // 스택에 값 추가
      if (!contextStacks.has(symbol)) {
        contextStacks.set(symbol, []);
      }
      contextStacks.get(symbol).push(value);

      try {
        return fn();
      } finally {
        // 함수 실행 후 스택에서 제거
        contextStacks.get(symbol).pop();
      }
    },

    use: () => {
      const stack = contextStacks.get(symbol);
      return stack && stack.length > 0 ? stack[stack.length - 1] : defaultValue;
    },
  };
}
