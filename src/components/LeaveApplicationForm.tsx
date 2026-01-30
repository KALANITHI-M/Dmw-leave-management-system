import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonDatetime,
} from '@ionic/react';
import { leaveService, LeaveApplication } from '../api/leaveService';
import './LeaveApplicationForm.css';

interface LeaveApplicationFormProps {
  onSuccess: () => void;
}

const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const [formData, setFormData] = useState({
    leaveType: '',
    dayType: 'single',
    fromDate: '',
    toDate: '',
    session: [] as string[],
    reason: '',
    description: '',
  });

  const sessionHours = [
    '1st Hour', '2nd Hour', '3rd Hour', '4th Hour', '5th Hour',
    '6th Hour', '7th Hour', '8th Hour', '9th Hour'
  ];

  const calculateDays = () => {
    if (formData.dayType === 'single') {
      return formData.session.length > 0 ? 0.5 : 1;
    }
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSessionToggle = (hour: string) => {
    setFormData(prev => ({
      ...prev,
      session: prev.session.includes(hour)
        ? prev.session.filter(h => h !== hour)
        : [...prev.session, hour]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.leaveType) {
      setToastMessage('Please select leave type');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!formData.fromDate) {
      setToastMessage('Please select leave date');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (formData.dayType === 'multi' && !formData.toDate) {
      setToastMessage('Please select end date for multi-day leave');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!formData.reason) {
      setToastMessage('Please provide leave reason');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const numberOfDays = calculateDays();

    const leaveData: LeaveApplication = {
      leaveType: formData.leaveType,
      startDate: formData.fromDate,
      endDate: formData.dayType === 'multi' && formData.toDate ? formData.toDate : formData.fromDate,
      numberOfDays,
      reason: formData.description || formData.reason,
    };

    setLoading(true);
    try {
      await leaveService.applyLeave(leaveData);
      setToastMessage('Leave application submitted successfully!');
      setToastColor('success');
      setShowToast(true);
      
      // Reset form
      setFormData({
        leaveType: '',
        dayType: 'single',
        fromDate: '',
        toDate: '',
        session: [],
        reason: '',
        description: '',
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to apply for leave');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-application-container">
      <IonCard className="leave-form-card">
        <IonCardHeader className="leave-form-header">
          <IonCardTitle>LEAVE APPLICATION</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            {/* Leave Type */}
            <IonRow>
              <IonCol size="12">
                <IonItem className="form-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE TYPE <span className="required">*</span>
                  </IonLabel>
                  <IonSelect
                    value={formData.leaveType}
                    placeholder="Select"
                    onIonChange={(e) => setFormData({ ...formData, leaveType: e.detail.value })}
                    interface="popover"
                    className="form-select"
                  >
                    <IonSelectOption value="Sick Leave">Sick Leave</IonSelectOption>
                    <IonSelectOption value="Casual Leave">Casual Leave</IonSelectOption>
                    <IonSelectOption value="Earned Leave">Earned Leave</IonSelectOption>
                    <IonSelectOption value="Maternity Leave">Maternity Leave</IonSelectOption>
                    <IonSelectOption value="Paternity Leave">Paternity Leave</IonSelectOption>
                    <IonSelectOption value="Other">Other</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Day Type */}
            <IonRow>
              <IonCol size="12">
                <IonLabel className="form-label section-label">DAY</IonLabel>
                <IonRadioGroup
                  value={formData.dayType}
                  onIonChange={(e) => setFormData({ ...formData, dayType: e.detail.value, toDate: '', session: [] })}
                  className="day-type-radio"
                >
                  <IonItem lines="none">
                    <IonRadio slot="start" value="single" />
                    <IonLabel>Single</IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonRadio slot="start" value="multi" />
                    <IonLabel>Multi</IonLabel>
                  </IonItem>
                </IonRadioGroup>
              </IonCol>
            </IonRow>

            {/* Leave Date(s) */}
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem className="form-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE ON <span className="required">*</span>
                  </IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={formData.fromDate}
                    onIonChange={(e) => setFormData({ ...formData, fromDate: e.detail.value as string || '' })}
                    className="form-input"
                  />
                </IonItem>
              </IonCol>
              {formData.dayType === 'multi' && (
                <IonCol size="12" sizeMd="6">
                  <IonItem className="form-item">
                    <IonLabel position="stacked" className="form-label">TO DATE</IonLabel>
                    <IonDatetime
                      presentation="date"
                      value={formData.toDate}
                      onIonChange={(e) => setFormData({ ...formData, toDate: e.detail.value as string || '' })}
                      min={formData.fromDate}
                      className="form-input"
                    />
                  </IonItem>
                </IonCol>
              )}
            </IonRow>

            {/* Session (for single day only) */}
            {formData.dayType === 'single' && (
              <IonRow>
                <IonCol size="12">
                  <IonLabel className="form-label section-label">SESSION <span className="optional">(Optional for hourly leave)</span></IonLabel>
                  <div className="session-grid">
                    {sessionHours.map((hour) => (
                      <div key={hour} className="session-checkbox">
                        <IonCheckbox
                          checked={formData.session.includes(hour)}
                          onIonChange={() => handleSessionToggle(hour)}
                        />
                        <IonLabel className="session-label">{hour}</IonLabel>
                      </div>
                    ))}
                  </div>
                </IonCol>
              </IonRow>
            )}

            {/* Leave Reason */}
            <IonRow>
              <IonCol size="12">
                <IonItem className="form-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE REASON <span className="required">*</span>
                  </IonLabel>
                  <IonInput
                    value={formData.reason}
                    placeholder="Brief reason for leave"
                    onIonInput={(e) => setFormData({ ...formData, reason: e.detail.value || '' })}
                    className="form-input"
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Leave Description */}
            <IonRow>
              <IonCol size="12">
                <IonItem className="form-item textarea-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE DESCRIPTION <span className="required">*</span>
                  </IonLabel>
                  <IonTextarea
                    value={formData.description}
                    placeholder="Detailed description..."
                    rows={4}
                    maxlength={500}
                    onIonInput={(e) => setFormData({ ...formData, description: e.detail.value || '' })}
                    className="form-textarea"
                  />
                  <p className="char-count">You have {500 - (formData.description?.length || 0)} chars left</p>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Submit Button */}
            <IonRow>
              <IonCol size="12">
                <div className="form-actions">
                  <IonButton
                    expand="block"
                    onClick={handleSubmit}
                    className="submit-btn"
                    disabled={loading}
                  >
                    Submit
                  </IonButton>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <IonLoading isOpen={loading} message="Submitting..." />
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
      />
    </div>
  );
};

export default LeaveApplicationForm;
