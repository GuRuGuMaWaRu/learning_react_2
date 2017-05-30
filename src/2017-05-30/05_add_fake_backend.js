import React from 'react';
import { render } from 'react-dom';
// import { PropTypes } from 'prop-types';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { withRouter } from 'react-router';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import { v4 } from 'node-uuid'; // generate random id

/* ... -- index.js
=====================================*/

const fakeDatabase = {
  todos: [{
    id: v4(),
    text: 'hey',
    completed: true,
  }, {
    id: v4(),
    text: 'ho',
    completed: true,
  }, {
    id: v4(),
    text: `lets's go`,
    completed: false,
  }],
};

const delay = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const fetchTodos = (filter) =>
  delay(500).then(() => {
    switch (filter) {
      case 'all':
        return fakeDatabase.todos;
      case 'active':
        return fakeDatabase.todos.filter(t => !t.completed);
      case 'completed':
        return fakeDatabase.todos.filter(t => t.completed);
      default:
        throw new Error(`Unknown filter: ${filter}`);
    }
  });

/* src/reducers -- todo.js
=====================================*/

const todo = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        id: action.id,
        text: action.text,
        completed: false
      };
    case 'TOGGLE_TODO':
      if (state.id !== action.id) {
        return state;
      }
      return {
        ...state,
        completed: !state.completed
      };
    default:
      return state;
  }
};

/* src/reducers -- todos.js
=====================================*/

const byId = (state = {}, action) => {
  switch (action.type) {
    case 'ADD_TODO':
    case 'TOGGLE_TODO':
      return {
        ...state,
        [action.id]: todo(state[action.id], action),
      };
    default:
      return state;
  }
};

const allIds = (state = [], action) => {
  switch(action.type) {
    case 'ADD_TODO':
      return [...state, action.id];
    default:
      return state;
  }
};

const todos = combineReducers({
  byId,
  allIds,
});

// export default todos;

const getAllTodos = (state) =>
  state.allIds.map(id => state.byId[id]);

// export const getVisibleTodos = (state, filter) => {
export const getVisibleTodosInner = (state, filter) => {
  const allTodos = getAllTodos(state);
  switch (filter) {
    case 'all':
      return allTodos;
    case 'completed':
      return allTodos.filter(t => t.completed);
    case 'active':
      return allTodos.filter(t => !t.completed);
    default:
      throw new Error(`Unknown filter: ${filter}.`);
  };
};

/* src/reducers -- index.js
=====================================*/
// import { combineReducers } from 'react-redux';
// import todos, * as fromTodos from './todos';

const todoApp = combineReducers({
  todos,
});

// export default todoApp;

export const getVisibleTodos = (state, filter) => {
  // fromTodos.getVisibleTodos(state.todos, filter);
  return getVisibleTodosInner(state.todos, filter);
};

/* src/actions -- index.js
=====================================*/

const addTodo = (text) => ({
  type: 'ADD_TODO',
  id: v4(),
  text
});

const toggleTodo = (id) => ({
  type: 'TOGGLE_TODO',
  id
});

/* components -- FilterLink.js
=====================================*/

const FilterLink = ({ filter, children }) => (
  <NavLink
    to={'/' + filter}
    activeStyle={{
      textDecoration: 'none',
      color: 'black',
    }}
  >
    {children}
  </NavLink>
);

/* components -- Footer.js
=====================================*/

const Footer = () => (
  <p>
    Show:
    {'  '}
    <FilterLink filter='all'>All</FilterLink>
    {'  '}
    <FilterLink filter='active'>Active</FilterLink>
    {'  '}
    <FilterLink filter='completed'>Completed</FilterLink>
  </p>
);

/*
=====================================*/

const Todo = ({ onClick, completed, text }) => (
  <li
    onClick={onClick}
    style={{textDecoration: completed ? 'line-through' : 'none'}}>
    {text}
  </li>
);

const TodoList = ({ todos, onTodoClick }) => (
  <ul>
    {todos.map(todo =>
      <Todo
        key={todo.id}
        {...todo}
        onClick={() => onTodoClick(todo.id)}
      />
    )}
  </ul>
);

let AddTodo = ({ dispatch }) => {
  let input;
  return (
    <div>
      <input ref={node => input = node} />
      <button onClick={() => {
        dispatch(addTodo(input.value));
        input.value = '';
      }}>
        Add Todo
      </button>
    </div>
  );
};
AddTodo = connect()(AddTodo)

/* components -- VisibleTodoList.js
=====================================*/
// import { connect } from 'react-redux';
// import { withRouter } from 'react-router';
// import { toggleTodo } from '../actions';
// import { getVisibleTodos } from '../reducers';
// import TodoList from './TodoList';

const mapStateToTodoListProps = (state, ownProps) => ({
  todos: getVisibleTodos(state, ownProps.match.params.filter || 'all')
});

const VisibleTodoList = withRouter(connect(
  mapStateToTodoListProps,
  { onTodoClick: toggleTodo }
)(TodoList));

/* components -- App.js
=====================================*/

const App = ({ match }) => (
  <div>
    <AddTodo />
    <VisibleTodoList />
    <Footer />
  </div>
);

/* components -- Root.js
=====================================*/
const Root = ({ store }) => (
  <Provider store={store}>
    <Router>
      <Route path='/:filter' component={App} />
    </Router>
  </Provider>
);

/* src -- configureStore.js
=====================================*/

const addLoggingToDispatch = (store) => {
  const rawDispatch = store.dispatch;
  if (!console.group) {
    return rawDispatch;
  }

  return (action) => {
    console.group(action.type);
    console.log('%c prev state', 'color: grey', store.getState());
    console.log('%c action', 'color: blue', action);
    const returnValue = rawDispatch(action);
    console.log('%c next state', 'color: green', store.getState());
    console.groupEnd(action.type);
    return returnValue;
  };
};

const configureStore = () => {
  const store = createStore(todoApp);

  if (process.env.NODE_ENV !== 'production') {
    store.dispatch = addLoggingToDispatch(store);
  }

  // store.subscribe = addLoggingToDispatch(store);

  return store;
};

/* src -- index.js
=====================================*/

fetchTodos('all').then(todos =>
  console.log(todos)
);

const store = configureStore();
render(
  <Root store={store} />,
  document.getElementById('root')
);
