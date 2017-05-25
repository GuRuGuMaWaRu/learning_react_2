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

const { createStore } = Redux;
const store = createStore(counter);

console.log(store.getState()); // 0

store.dispatch({ type: 'INCREMENT' });
console.log(store.getState()); // 1

const render = () => {
  document.body.innerText = store.getState();
};

store.subscribe(render); // subscribe to any state changes
render(); // render initial state

document.addEventListener('click', () => {
  store.dispatch({ type: 'INCREMENT' }); // 2
});
