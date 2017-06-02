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
