import React, { useEffect, useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import {
  timeOutline,
  moonOutline,
  sunnyOutline,
  alertCircleOutline,
  alarmOutline,
  timerOutline,
} from 'ionicons/icons';
import { shiftService, Shift } from '../api/shiftService';
import './MyShift.css';

const MyShift: React.FC = () => {
  const [shift, setShift] = useState<Shift | null | undefined>(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    shiftService.getMyShift().then((s) => {
      setShift(s);
    }).catch(() => {
      setFetchError(true);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const shiftIcon = (startTime: string) => {
    const h = parseInt(startTime.split(':')[0]);
    if (h >= 5 && h < 12) return sunnyOutline;   // Morning
    if (h >= 12 && h < 17) return timeOutline;   // Afternoon
    return moonOutline;                            // Evening/Night
  };

  const shiftIconColor = (startTime: string) => {
    const h = parseInt(startTime.split(':')[0]);
    if (h >= 5 && h < 12) return 'var(--ion-color-warning)';  // orange/yellow for sun
    if (h >= 12 && h < 17) return 'var(--ion-color-primary)'; // blue for clock
    return '#7b5ea7';                                           // purple for moon
  };

  if (loading) {
    return (
      <div className="my-shift-spinner">
        <IonSpinner />
      </div>
    );
  }

  return (
    <div className="my-shift-page">
      <IonCard className="my-shift-header-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={timeOutline} className="header-icon" />
            My Shift
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {fetchError ? (
            <div className="no-shift-box">
              <IonIcon icon={alertCircleOutline} className="no-shift-icon" color="danger" />
              <h3>Could not load shift information</h3>
              <p>A network error occurred. Please check your connection and try again.</p>
            </div>
          ) : !shift ? (
            <div className="no-shift-box">
              <IonIcon icon={alertCircleOutline} className="no-shift-icon" color="medium" />
              <h3>No shift assigned yet</h3>
              <p>Your HR manager has not assigned a shift to you. Please contact HR.</p>
            </div>
          ) : (
            <>
              <div className="shift-name-row">
                <IonIcon icon={shiftIcon(shift.startTime)} className="shift-type-icon" style={{ color: shiftIconColor(shift.startTime) }} />
                <h2 className="shift-display-name">{shift.name}</h2>
                {shift.isActive ? (
                  <IonBadge color="success">Active</IonBadge>
                ) : (
                  <IonBadge color="medium">Inactive</IonBadge>
                )}
              </div>

              <IonGrid className="shift-detail-grid">
                <IonRow>
                  <IonCol size="6" sizeMd="3">
                    <div className="shift-detail-card">
                      <IonIcon icon={timeOutline} color="primary" />
                      <p className="detail-label">Start Time</p>
                      <p className="detail-value">{fmt(shift.startTime)}</p>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <div className="shift-detail-card">
                      <IonIcon icon={timeOutline} color="danger" />
                      <p className="detail-label">End Time</p>
                      <p className="detail-value">{fmt(shift.endTime)}</p>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <div className="shift-detail-card">
                      <IonIcon icon={alarmOutline} color="warning" />
                      <p className="detail-label">Late After</p>
                      <p className="detail-value">{shift.lateAfterMinutes} min</p>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <div className="shift-detail-card">
                      <IonIcon icon={timerOutline} color="tertiary" />
                      <p className="detail-label">Working Hours</p>
                      <p className="detail-value">{shift.workingHours} hrs/day</p>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>

              <div className="shift-info-box">
                <p>
                  <strong>Your attendance will be marked as "Late"</strong> if you check in more than{' '}
                  <strong>{shift.lateAfterMinutes} minutes</strong> after{' '}
                  <strong>{fmt(shift.startTime)}</strong>.
                </p>
                <p>
                  Attendance will be marked as <strong>"Half Day"</strong> if total working hours
                  are less than <strong>{shift.workingHours / 2} hours</strong>.
                </p>
              </div>
            </>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default MyShift;
