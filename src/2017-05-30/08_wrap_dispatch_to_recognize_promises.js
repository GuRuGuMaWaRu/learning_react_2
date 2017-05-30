import React, { Component } from 'react';
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

export const fetchTodosApi = (filter) =>
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

const receiveTodos = (filter, response) => ({
  type: 'RECEIVE_TODOS',
  filter,
  response,
});

export const fetchTodos = (filter) =>
  fetchTodosApi(filter).then(response =>
    receiveTodos(filter, response)
  );

export const addTodo = (text) => ({
  type: 'ADD_TODO',
  id: v4(),
  text,
});

export const toggleTodo = (id) => ({
  type: 'TOGGLE_TODO',
  id,
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

class VisibleTodoList extends Component {
  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.filter !== prevProps.filter) {
      this.fetchData();
    }
  }

  fetchData() {
    const { filter, fetchTodos } = this.props;
    fetchTodos(filter);
  }

  render() {
    const { toggleTodo, ...rest } = this.props;
    return (
      <TodoList
        {...rest}
        onTodoClick={toggleTodo}
      />
    );
  }
}

const mapStateToTodoListProps = (state, ownProps) => {
  const filter = ownProps.match.params.filter || 'all';
  return {
    todos: getVisibleTodos(state, filter),
    filter,
  }
};

VisibleTodoList = withRouter(connect(
  mapStateToTodoListProps,
  { toggleTodo, receiveTodos, fetchTodos }
)(VisibleTodoList));

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

const configureStore = () => {
  const store = createStore(todoApp);

  const addPromiseSupportToDispatch = (store) => {
    const rawDispatch = store.dispatch;
    return (action) => {
      if (typeof action.then === 'function') {
        return action.then(rawDispatch);
      }
      return rawDispatch(action);
    }
  };

  store.dispatch = addPromiseSupportToDispatch(store);

  return store;
};

/* src -- index.js
=====================================*/

const store = configureStore();
render(
  <Root store={store} />,
  document.getElementById('root')
);
