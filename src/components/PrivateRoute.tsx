import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps extends RouteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  role?: 'employee' | 'hr' | 'service engineer';
  allowRoles?: ('employee' | 'hr' | 'service engineer')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  component: Component, 
  role,
  allowRoles,
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

        // Check role access - either single role or allowRoles array
        if (allowRoles && allowRoles.length > 0) {
          if (!allowRoles.includes(persistedUser?.role)) {
            return <Redirect to="/login" />;
          }
        } else if (role && persistedUser?.role !== role) {
          return <Redirect to="/login" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;