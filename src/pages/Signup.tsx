import React, { useState } from 'react';
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
  IonDatetime,
  IonModal,
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  briefcaseOutline,
  callOutline,
  calendarOutline,
  idCardOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import './Signup.css';

const Signup: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
    phoneNumber: '',
    joiningDate: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation (you can replace with your existing logic)
    if (
      !formData.employeeId ||
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.department ||
      !formData.designation ||
      !formData.phoneNumber ||
      !formData.joiningDate
    ) {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToastMessage('Passwords do not match');
      setShowToast(true);
      return;
    }

    if (formData.password.length < 6) {
      setToastMessage('Password must be at least 6 characters');
      setShowToast(true);
      return;
    }

    // Validate Employee ID format (6 digits)
    const employeeIdRegex = /^\d{6}$/;
    if (!employeeIdRegex.test(formData.employeeId)) {
      setToastMessage('Employee ID must be exactly 6 digits (e.g., 123456)');
      setShowToast(true);
      return;
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setToastMessage('Phone number must be exactly 10 digits');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      // Call backend signup API
      const userData = await authService.signup(formData);
      
      // Auto-login after successful signup
      login(userData);
      
      setToastMessage('Account created successfully!');
      setShowToast(true);
      
      // Navigate to appropriate dashboard based on role
      setTimeout(() => {
        if (userData.role === 'hr') {
          history.push('/hr/dashboard');
        } else {
          history.push('/employee/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || 'Signup failed. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-container">
          <div className="logo-container">
            <img src="/dmwindia_logo.jpg" alt="DMW Logo" className="company-logo" />
            <IonText>
              <h1>DMW CNC Solutions</h1>
              <p>Employee Registration</p>
            </IonText>
          </div>

          <IonCard className="signup-card">
            <IonCardContent>
              <form onSubmit={handleSignup}>
                <IonItem lines="none" className="input-item">
                  <IonIcon icon={idCardOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Employee ID</IonLabel>
                  <IonInput
                    type="text"
                    inputmode="numeric"
                    maxlength={6}
                    value={formData.employeeId}
                    onIonChange={(e) => handleChange('employeeId', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="6-digit Employee ID (e.g., 123456)"
                  />
                </IonItem>

                <IonItem lines="none" className="input-item">
                  <IonIcon icon={personOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Full Name</IonLabel>
                  <IonInput
                    type="text"
                    value={formData.name}
                    onIonChange={(e) => handleChange('name', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="Enter your full name"
                  />
                </IonItem>

                <IonItem lines="none" className="input-item">
                  <IonIcon icon={mailOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={formData.email}
                    onIonChange={(e) => handleChange('email', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="Enter your email"
                  />
                </IonItem>

                {/* Password with eye icon */}
                <IonItem lines="none" className="input-item">
                  <IonIcon icon={lockClosedOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Password</IonLabel>
                  <IonInput
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onIonChange={(e) => handleChange('password', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="Minimum 6 characters"
                  />
                  <IonIcon
                    slot="end"
                    icon={showPassword ? eyeOffOutline : eyeOutline}
                    className="toggle-password-icon"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                </IonItem>

                {/* Confirm Password with eye icon */}
                <IonItem lines="none" className="input-item">
                  <IonIcon icon={lockClosedOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Confirm Password</IonLabel>
                  <IonInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onIonChange={(e) => handleChange('confirmPassword', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="Re-enter password"
                  />
                  <IonIcon
                    slot="end"
                    icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                    className="toggle-password-icon"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  />
                </IonItem>

                <IonItem lines="none" className="input-item">
                  <IonIcon icon={briefcaseOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Department</IonLabel>
                  <IonInput
                    type="text"
                    value={formData.department}
                    onIonChange={(e) => handleChange('department', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="e.g., Engineering, HR, Sales"
                  />
                </IonItem>

                <IonItem lines="none" className="input-item">
                  <IonIcon icon={briefcaseOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Designation</IonLabel>
                  <IonInput
                    type="text"
                    value={formData.designation}
                    onIonChange={(e) => handleChange('designation', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </IonItem>

                <IonItem lines="none" className="input-item">
                  <IonIcon icon={callOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    inputmode="numeric"
                    maxlength={10}
                    value={formData.phoneNumber}
                    onIonChange={(e) => handleChange('phoneNumber', e.detail.value || '')}
                    required
                    className="custom-input"
                    placeholder="10-digit mobile number"
                  />
                </IonItem>

                {/* Joining Date: text input + calendar icon that opens modal */}
                <IonItem lines="none" className="input-item">
                  <IonIcon icon={calendarOutline} slot="start" className="input-icon" />
                  <IonLabel position="stacked" className="input-label">Joining Date</IonLabel>
                  <IonInput
                    type="text"
                    value={formData.joiningDate}
                    onIonChange={(e) => handleChange('joiningDate', e.detail.value || '')}
                    placeholder="YYYY-MM-DD"
                    className="custom-input"
                  />
                  <IonIcon
                    slot="end"
                    icon={calendarOutline}
                    className="toggle-password-icon"
                    onClick={() => setShowDatePicker(true)}
                  />
                </IonItem>

                <IonButton expand="block" type="submit" className="signup-button">
                  Sign Up
                </IonButton>

                <div className="login-link">
                  <IonText color="medium">
                    Already have an account?{' '}
                    <span onClick={() => history.push('/login')} className="link">
                      Login
                    </span>
                  </IonText>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Date picker modal */}
        <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
          <IonContent className="ion-padding">
            <IonDatetime
              presentation="date"
              value={formData.joiningDate}
              onIonChange={(e) => {
                const val = e.detail.value as string | null;
                if (val) {
                  const dateStr = val.includes('T') ? val.split('T')[0] : val;
                  handleChange('joiningDate', dateStr);
                }
              }}
            />
            <IonButton expand="block" onClick={() => setShowDatePicker(false)}>
              Done
            </IonButton>
          </IonContent>
        </IonModal>

        <IonLoading isOpen={loading} message="Creating account..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastMessage.includes('success') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Signup;