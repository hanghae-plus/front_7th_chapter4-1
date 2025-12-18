import { createObserver } from "./createObserver.js";

/**
 * Redux-style Store 생성 함수
 * @param {Function} reducer - (state, action) => newState 형태의 reducer 함수
 * @param {*} initialState - 초기 상태
 * @returns {Object} { getState, dispatch, subscribe }
 */
export const createStore = (key, reducer, initialState) => {
  const { subscribe, notify } = createObserver();

  if ("window" in globalThis) {
    console.log("initialState", initialState);
    console.log("initialData[key]", window.__INITIAL_DATA__?.[key]);
    initialState = window.__INITIAL_DATA__?.[key] ?? initialState;
  }

  let state = initialState;

  const getState = () => state;

  const dispatch = (action) => {
    const newState = reducer(state, action);

    if (!("window" in globalThis)) {
      console.log("newState", newState);
      globalThis.initialData[key] = newState;
    }

    if (newState !== state) {
      state = newState;
      notify();
    }
  };

  return { getState, dispatch, subscribe };
};
