/**
 * 전역 이벤트 핸들러 저장소
 * eventType -> selector -> handler 구조
 */
const eventHandlers = {};

/**
 * 전역 이벤트 처리 함수
 */
const handleGlobalEvents = (e) => {
  const handlers = eventHandlers[e.type];
  if (!handlers) return;

  // 각 선택자에 대해 확인
  for (const [selector, handler] of Object.entries(handlers)) {
    const targetElement = e.target.closest(selector);

    // 일치하는 요소가 있으면 핸들러 실행
    if (targetElement) {
      try {
        handler(e);
      } catch (error) {
        console.error(`이벤트 핸들러 실행 오류 (${selector}):`, error);
      }
    }
  }
};

/**
 * 등록된 이벤트 타입 추적
 */
const registeredEventTypes = new Set();

/**
 * 특정 이벤트 타입에 대한 리스너 등록
 */
const registerEventListener = (eventType) => {
  if (typeof document === "undefined" || registeredEventTypes.has(eventType)) {
    return;
  }

  document.body.addEventListener(eventType, handleGlobalEvents);
  registeredEventTypes.add(eventType);
};

/**
 * 전역 이벤트 리스너 등록 (한 번만 실행)
 */
export const registerGlobalEvents = (() => {
  let initialized = false;
  return () => {
    if (initialized) {
      return;
    }

    Object.keys(eventHandlers).forEach((eventType) => {
      registerEventListener(eventType);
    });

    initialized = true;
  };
})();

/**
 * 이벤트 위임을 통한 이벤트 핸들러 추가
 * @param {string} eventType - 이벤트 타입 (click, submit 등)
 * @param {string} selector - CSS 선택자
 * @param {Function} handler - 이벤트 핸들러 함수
 */
export const addEvent = (eventType, selector, handler) => {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = {};
    // 새로운 이벤트 타입이 추가되면 즉시 리스너 등록
    registerEventListener(eventType);
  }

  eventHandlers[eventType][selector] = handler;
};
