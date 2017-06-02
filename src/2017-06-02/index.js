import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { withRouter } from 'react-router';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import { v4 } from 'node-uuid'; // generate random id
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import { schema } from 'normalizr';
import { normalize } from 'normalizr';

const store = configureStore();
render(
  <Root store={store} />,
  document.getElementById('root')
);
