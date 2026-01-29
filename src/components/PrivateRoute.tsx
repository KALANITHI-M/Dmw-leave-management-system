import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  role?: 'employee' | 'hr';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  component: Component, 
  role,
  ...rest 
}) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }

        if (role && user?.role !== role) {
          return <Redirect to="/login" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;