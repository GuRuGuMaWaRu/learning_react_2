import React, { Component } from 'react';
import { render } from 'react-dom';
// import { PropTypes } from 'prop-types';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { withRouter } from 'react-router';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import { v4 } from 'node-uuid'; // generate random id

import promise from 'redux-promise';
import { createLogger } from 'redux-logger';

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

/* src/reducers -- byId.js
=====================================*/

const byId = (state = {}, action) => {
  switch (action.type) {
    case 'RECEIVE_TODOS':
      const nextState = { ...state };
      action.response.forEach(todo => {
        nextState[todo.id] = todo;
      });
      return nextState;
    default:
      return state;
  }
};

const getTodo = (state, id) => state[id];

/* src/reducers -- createList.js
=====================================*/

const createList = (filter) => {
  const ids = (state = [], action) => {
    if (action.filter !== filter) {
      return state;
    }
    switch (action.type) {
      case 'RECEIVE_TODOS':
        return action.response.map(todo => todo.id);
      default:
        return state;
    }
  };

  const isFetching = (state = false, action) => {
    if (action.filter !== filter) {
      return state;
    }
    switch (action.type) {
      case 'REQUEST_TODOS':
        return true;
      case 'RECEIVE_TODOS':
        return false;
      default:
        return state;
    }
  };

  return combineReducers({
    ids,
    isFetching,
  });
};

export const getIds = (state) => state.ids;
export const getIsFetchingInner = (state) => state.isFetching;

/* src/reducers -- index.js
=====================================*/

const listByFilter = combineReducers({
  all: createList('all'),
  active: createList('active'),
  completed: createList('completed'),
});

const todos = combineReducers({
  byId,
  listByFilter,
});

export const getVisibleTodos = (state, filter) => {
  const ids = getIds(state.listByFilter[filter]);
  return ids.map(id => getTodo(state.byId, id));
};

export const getIsFetching = (state, filter) =>
  getIsFetchingInner(state.listByFilter[filter]);

/* src/actions -- index.js
=====================================*/

export const requestTodos = (filter) => ({
  type: 'REQUEST_TODOS',
  filter,
});

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
    const { filter, requestTodos, fetchTodos } = this.props;
    requestTodos(filter);
    fetchTodos(filter);
  }

  render() {
    const { toggleTodo, todos, isFetching } = this.props;
    if (isFetching && !todos.length) {
      return <p>Loading...</p>;
    }

    return (
      <TodoList
        todos={todos}
        onTodoClick={toggleTodo}
      />
    );
  }
}

const mapStateToTodoListProps = (state, ownProps) => {
  const filter = ownProps.match.params.filter || 'all';
  return {
    todos: getVisibleTodos(state, filter),
    isFetching: getIsFetching(state, filter),
    filter,
  }
};

VisibleTodoList = withRouter(connect(
  mapStateToTodoListProps,
  { toggleTodo, receiveTodos, fetchTodos, requestTodos }
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
  const middlewares = [promise];

  if (process.env.NODE_ENV !== 'production') {
    middlewares.push(createLogger());
  }

  return createStore(
    todos,
    applyMiddleware(...middlewares)
  );
};

/* src -- index.js
=====================================*/

const store = configureStore();
render(
  <Root store={store} />,
  document.getElementById('root')
);
