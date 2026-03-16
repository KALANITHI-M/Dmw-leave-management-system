import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CRASH] ErrorBoundary caught error:', error.message, '\nStack:', error.stack, '\nComponent Stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 20, color: 'red', background: '#fff',
          fontSize: 14, whiteSpace: 'pre-wrap',
          overflowY: 'auto', height: '100vh', zIndex: 9999,
          position: 'absolute', top: 0, left: 0, right: 0
        }}>
          <strong>App Error:</strong>{'\n'}{this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

setupIonicReact({ 
  animated: false,
  mode: 'md',  // Force Material Design mode — prevents iOS animation system causing ion-page-invisible bug on Android
});

const observer = new MutationObserver(() => {
  document.querySelectorAll('.ion-page-invisible, .ion-page-hidden').forEach((el) => {
    el.classList.remove('ion-page-invisible', 'ion-page-hidden');
    (el as HTMLElement).style.setProperty('opacity', '1', 'important');
    (el as HTMLElement).style.setProperty('visibility', 'visible', 'important');
    (el as HTMLElement).style.setProperty('display', 'block', 'important');
  });
  // Also fix any element with opacity 0 set via inline style inside ion-router-outlet
  const outlet = document.querySelector('ion-router-outlet');
  if (outlet) {
    outlet.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]').forEach((el) => {
      (el as HTMLElement).style.setProperty('opacity', '1', 'important');
    });
  }
});
observer.observe(document.body, { subtree: true, attributes: true, childList: true, attributeFilter: ['class', 'style'] });





const App: React.FC = () => (
  <ErrorBoundary>
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet id="main-outlet" style={{ opacity: 1, visibility: 'visible' }}>
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <PrivateRoute
              exact
              path="/employee/dashboard"
              component={EmployeeDashboard}
              role="employee"
            />
            <PrivateRoute
              exact
              path="/hr/dashboard"
              component={HRDashboard}
              role="hr"
            />
            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  </ErrorBoundary>
);

export default App;