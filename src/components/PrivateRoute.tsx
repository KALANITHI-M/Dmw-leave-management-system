import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps extends RouteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  role?: 'employee' | 'hr';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  component: Component, 
  role,
  ...rest 
}) => {
  const { user, isAuthenticated } = useAuth();

  let persistedUser = user;
  if (!persistedUser) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        persistedUser = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  const canAccess = isAuthenticated || !!persistedUser;

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!canAccess) {
          return <Redirect to="/login" />;
        }

        if (role && persistedUser?.role !== role) {
          return <Redirect to="/login" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;