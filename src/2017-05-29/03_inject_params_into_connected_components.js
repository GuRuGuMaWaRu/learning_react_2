import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { PropTypes } from 'prop-types';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { withRouter } from 'react-router';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import { v4 } from 'node-uuid'; // generate random id
import throttle from 'lodash/throttle';

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

const todos = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        todo(undefined, action),
      ];
    case 'TOGGLE_TODO':
      return state.map(t => todo(t, action));
    default:
      return state;
  }
};

const todoApp = combineReducers({
  todos,
});

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

const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'all':
      return todos;
    case 'completed':
      return todos.filter(t => t.completed);
    case 'active':
      return todos.filter(t => !t.completed);
  };
};

const mapStateToTodoListProps = (state, { match }) => ({
  todos: getVisibleTodos(state.todos, match.filter || 'all')
});
const mapDispatchToTodoListProps = (dispatch) => ({
  onTodoClick (id) {
    dispatch(toggleTodo(id));
  },
});
const VisibleTodoList = withRouter(connect(
  mapStateToTodoListProps,
  mapDispatchToTodoListProps
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

/* src -- localStorage.js
=====================================*/

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

/* src -- configureStore.js
=====================================*/

const configureStore = () => {
  const persistedState = loadState();
  const store = createStore(todoApp, persistedState);

  store.subscribe(throttle(() => {
    saveState({
      todos: store.getState().todos
    });
  }, 1000));

  return store;
}

/* src -- index.js
=====================================*/

const store = configureStore();

ReactDOM.render(
  <Root store={store} />,
  document.getElementById('root')
);

/* src -- devServer.js
=====================================*/
// import path from 'path';
// import webpack from 'webpack';
// import webpackDevMiddleware from 'webpack-dev-middleware';
// import config from './webpack.config.babel';
// import Express from 'express';
//
// const app = new Express();
// const port = 3000;
//
// const compiler = webpack(config);
// app.use(webpackDevMiddleware(compiler, {
//   noinfo: true,
//   publicPath: config.output.publicPath,
// }))

// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.js'));
// });
//
// app.listen(port, error => {
//   /* eslint-disable no-console */
//   if (error) {
//     console.error(error);
//   } else {
//
//   }
// });
