import React, { useState } from 'react';
import axios from 'axios';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonLoading,
  IonToast,
  IonIcon,
} from '@ionic/react';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();
  const { login } = useAuth();

  const executeLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    console.log('[DEBUG] executeLogin triggered for user:', normalizedEmail);

    if (!normalizedEmail || !password) {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const userData = await authService.login({ email: normalizedEmail, password });
      login(userData);

      const activeElement = document.activeElement as HTMLElement | null;
      activeElement?.blur();
      
      if (userData.role === 'hr') {
        history.replace('/hr/dashboard');
      } else {
        history.replace('/employee/dashboard');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ||
          (error.code === 'ERR_NETWORK'
            ? 'Cannot connect to server. Please check your internet or backend URL.'
            : 'Login failed. Please try again.')
        : 'Login failed. Please try again.';
      setToastMessage(message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" scrollY={true}>
        <div className="login-container">
          <div className="logo-container">
            <img src="/dmwindia_logo.jpg" alt="DMW Logo" className="company-logo" />
            <IonText>
              <h1>DMW CNC Solutions</h1>
              <p>Leave Management System</p>
            </IonText>
          </div>


<IonCard className="login-card">
  <IonCardContent>
    <form onSubmit={(e) => { e.preventDefault(); executeLogin(); }}>
      <IonItem lines="none" className="input-item">
        <IonIcon icon={mailOutline} slot="start" className="input-icon" />
        <IonLabel position="stacked" className="input-label">Email</IonLabel>
        <IonInput
          type="email"
          value={email}
          onIonInput={(e) => setEmail(e.detail.value!)}
          required
          className="custom-input"
          placeholder="Enter your email"
        />
      </IonItem>

      <IonItem lines="none" className="input-item">
        <IonIcon icon={lockClosedOutline} slot="start" className="input-icon" />
        <IonLabel position="stacked" className="input-label">Password</IonLabel>
        <IonInput
          type={showPassword ? "text" : "password"}
          value={password}
          onIonInput={(e) => setPassword(e.detail.value!)}
          required
          className="custom-input"
          placeholder="Enter your password"
        />
        <IonIcon
          icon={showPassword ? eyeOffOutline : eyeOutline}
          slot="end"
          onClick={() => setShowPassword(!showPassword)}
          style={{ cursor: 'pointer', marginLeft: '8px' }}
        />
      </IonItem>

      <IonButton expand="block" type="submit" className="login-button">
        Login
      </IonButton>

      <div className="signup-link">
        <IonText>
          Don't have an account?{' '}
          <span onClick={() => history.push('/signup')} className="link">
            Sign Up
          </span>
        </IonText>
      </div>
    </form>
  </IonCardContent>
</IonCard>
        </div>

        <IonLoading isOpen={loading} message="Logging in..." />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;