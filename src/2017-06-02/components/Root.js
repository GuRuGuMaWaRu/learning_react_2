const Root = ({ store }) => (
  <Provider store={store}>
    <Router>
      <Route path='/:filter' component={App} />
    </Router>
  </Provider>
);
