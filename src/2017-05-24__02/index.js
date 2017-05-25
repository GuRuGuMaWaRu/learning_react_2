/* start: reducer */
const counter = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}
/* end: reducer */

/* start: createStore */
const createStore = (reducer) => {
  let state;
  let listeners = [];

  const getState = () => state;

  const dispatch = (action) => {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  dispatch({});

  return { getState, dispatch, subscribe };
};
/* end: createStore */

const store = createStore(counter);

const render = () => {
  document.body.innerText = store.getState();
};

store.subscribe(render); // perform on any state change
render(); // render initial state

document.addEventListener('click', () => {
  store.dispatch({ type: 'INCREMENT' }); // 1
});
