import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';

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

const Counter = ({ value }) => (
  <h1>{value}</h1>
);

const store = createStore(counter);

const render = () => {
  ReactDOM.render(
    <Counter value={store.getState()} />,
    document.getElementById('root')
  );
};

store.subscribe(render); // subscribe to any state changes
render(); // render initial state

document.addEventListener('click', () => {
  store.dispatch({ type: 'INCREMENT' }); // 2
});
