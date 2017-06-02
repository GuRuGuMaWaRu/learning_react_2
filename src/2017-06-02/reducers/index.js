import * as fromCreateList from './createList';
import * as fromById from './byId';

const listByFilter = combineReducers({
  all: createList('all'),
  active: createList('active'),
  completed: createList('completed'),
});

export const todos = combineReducers({
  byId,
  listByFilter,
});

export const getIsFetching = (state, filter) =>
  fromCreateList.getIsFetching(state.listByFilter[filter]);

export const getErrorMessage = (state, filter) =>
  fromCreateList.getErrorMessage(state.listByFilter[filter]);

export const getVisibleTodos = (state, filter) => {
  const ids = fromCreateList.getIds(state.listByFilter[filter]);
  return ids.map(id => fromById.getTodo(state.byId, id));
};
