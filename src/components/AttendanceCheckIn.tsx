import React, { useState, useEffect, useRef } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonBadge,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import {
  locationOutline,
  qrCodeOutline,
  timeOutline,
  checkmarkCircleOutline,
  logOutOutline,
  closeOutline,
  refreshOutline,
} from 'ionicons/icons';
import { attendanceService, Location, Attendance } from '../api/attendanceService';
import './AttendanceCheckIn.css';

// ── Office coordinates (must match backend .env) ──────────────────────────
const OFFICE_LAT = 11.286796;
const OFFICE_LNG = 77.609748;
const OFFICE_RADIUS_M = 500;
const OFFICE_NAME = 'DMW CNC Solutions (Perundurai Unit)';

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AttendanceCheckIn: React.FC = () => {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [locationData, setLocationData] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [inRange, setInRange] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [showToast, setShowToast] = useState(false);
  const qrCodeRef = useRef<any>(null);

  useEffect(() => {
    loadTodayAttendance();
    fetchGPS();
  }, []);

  const loadTodayAttendance = async () => {
    try {
      const att = await attendanceService.getTodayAttendance();
      setTodayAttendance(att);
    } catch (_) {}
  };

  const fetchGPS = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationData({ lat, lng });
        const dist = haversineMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);
        setDistanceMeters(Math.round(dist));
        setInRange(dist <= OFFICE_RADIUS_M);
        setLocationStatus('success');
      },
      () => { setLocationStatus('error'); setDistanceMeters(null); setInRange(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const showMessage = (msg: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  };

  const handleCheckIn = async (method: 'gps' | 'qr' | 'manual', qrToken?: string) => {
    setLoadingAction(true);
    try {
      const att = await attendanceService.checkIn({
        location: locationData || {},
        method,
        qrToken,
      });
      setTodayAttendance(att);
      const statusLabel = att.status.charAt(0).toUpperCase() + att.status.slice(1).replace('-', ' ');
      showMessage(`Checked in successfully! Status: ${statusLabel}`);
    } catch (e: any) {
      showMessage(e.response?.data?.message || 'Check-in failed', 'danger');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingAction(true);
    try {
      const att = await attendanceService.checkOut({
        location: locationData || {},
        method: 'gps',
      });
      setTodayAttendance(att);
      showMessage(`Checked out! You worked ${att.workingHours}h today.`);
    } catch (e: any) {
      showMessage(e.response?.data?.message || 'Check-out failed', 'danger');
    } finally {
      setLoadingAction(false);
    }
  };

  const startQRScanner = async () => {
    setScanError('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader-div');
      qrCodeRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await stopQRScanner();
          setShowQRModal(false);
          await handleCheckIn('qr', decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setScanning(false);
      setScanError(
        'Camera access denied or unavailable. Allow camera permissions and try again.'
      );
    }
  };

  const stopQRScanner = async () => {
    if (qrCodeRef.current) {
      try {
        await qrCodeRef.current.stop();
      } catch (_) {}
      qrCodeRef.current = null;
    }
    setScanning(false);
  };

  const closeQRModal = async () => {
    await stopQRScanner();
    setShowQRModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      case 'half-day': return 'tertiary';
      default: return 'medium';
    }
  };

  const formatTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const hasCheckedIn = !!todayAttendance?.checkIn?.time;
  const hasCheckedOut = !!todayAttendance?.checkOut?.time;

  return (
    <div className="attendance-checkin">
      {/* Today's Status */}
      <IonCard className="att-status-card">
        <IonCardHeader>
          <IonCardTitle>Today's Attendance</IonCardTitle>
          <p className="att-today-date">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </IonCardHeader>
        <IonCardContent>
          {todayAttendance ? (
            <div className="att-status-info">
              <IonBadge
                color={getStatusColor(todayAttendance.status)}
                className="att-status-badge"
              >
                {todayAttendance.status.replace('-', ' ').toUpperCase()}
              </IonBadge>
              <div className="att-time-row">
                <div className="att-time-item">
                  <IonIcon icon={timeOutline} />
                  <span>
                    <strong>In:</strong> {formatTime(todayAttendance.checkIn?.time)}
                  </span>
                  {todayAttendance.checkIn?.method && (
                    <span className="att-method-tag">
                      {todayAttendance.checkIn.method.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="att-time-item">
                  <IonIcon icon={timeOutline} />
                  <span>
                    <strong>Out:</strong> {formatTime(todayAttendance.checkOut?.time)}
                  </span>
                  {todayAttendance.checkOut?.method && (
                    <span className="att-method-tag">
                      {todayAttendance.checkOut.method.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {todayAttendance.workingHours !== undefined && todayAttendance.workingHours > 0 && (
                <p className="att-working-hours">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  Working hours: <strong>{todayAttendance.workingHours}h</strong>
                </p>
              )}
            </div>
          ) : (
            <p className="att-not-checked">Not checked in yet today</p>
          )}
        </IonCardContent>
      </IonCard>

      {/* GPS Location & Geofence Status */}
      <IonCard className={`att-location-card ${locationStatus === 'success' ? (inRange ? 'att-location-inrange' : 'att-location-outrange') : ''}`}>
        <IonCardContent className="att-location-content">
          <IonIcon
            icon={locationOutline}
            className="att-location-icon"
            color={
              locationStatus === 'success'
                ? inRange ? 'success' : 'danger'
                : locationStatus === 'error'
                ? 'warning'
                : 'medium'
            }
          />
          <div className="att-location-text">
            {locationStatus === 'fetching' && (
              <><IonSpinner name="dots" /> Fetching GPS location…</>
            )}
            {locationStatus === 'success' && locationData && (
              <div className="att-location-detail">
                <span className="att-office-name">{OFFICE_NAME}</span>
                {inRange ? (
                  <span className="att-range-ok">✓ You are within range ({distanceMeters} m from office)</span>
                ) : (
                  <span className="att-range-fail">⚠ You are {distanceMeters} m away — must be within {OFFICE_RADIUS_M} m for GPS check-in</span>
                )}
              </div>
            )}
            {locationStatus === 'error' && (
              <span className="att-location-error">
                Location unavailable — enable GPS and refresh
              </span>
            )}
            {locationStatus === 'idle' && <span>Location not fetched yet</span>}
          </div>
          {locationStatus !== 'fetching' && (
            <IonButton fill="clear" size="small" onClick={fetchGPS}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>

      {/* Action Buttons */}
      <div className="att-actions">
        {!hasCheckedIn && (
          <>
            <IonButton
              expand="block"
              color="success"
              onClick={() => handleCheckIn('gps')}
              disabled={loadingAction || !inRange || locationStatus !== 'success'}
              className="att-btn"
            >
              {loadingAction ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  {locationStatus === 'fetching'
                    ? 'Fetching location…'
                    : !inRange && locationStatus === 'success'
                    ? `Too far (${distanceMeters} m away)`
                    : 'Check In (GPS)'}
                </>
              )}
            </IonButton>
            <IonButton
              expand="block"
              color="primary"
              fill="outline"
              onClick={() => setShowQRModal(true)}
              disabled={loadingAction}
              className="att-btn"
            >
              <IonIcon icon={qrCodeOutline} slot="start" />
              Check In (Scan QR)
            </IonButton>
          </>
        )}

        {hasCheckedIn && !hasCheckedOut && (
          <IonButton
            expand="block"
            color="warning"
            onClick={handleCheckOut}
            disabled={loadingAction}
            className="att-btn"
          >
            {loadingAction ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon icon={logOutOutline} slot="start" />
                Check Out
              </>
            )}
          </IonButton>
        )}

        {hasCheckedIn && hasCheckedOut && (
          <div className="att-completed">
            <IonIcon icon={checkmarkCircleOutline} color="success" />
            <span>Attendance completed for today</span>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <IonModal
        isOpen={showQRModal}
        onDidPresent={startQRScanner}
        onWillDismiss={closeQRModal}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Scan Office QR Code</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeQRModal}>
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="qr-modal-body">
          <p className="qr-scan-hint">
            Point your camera at the QR code displayed in the office
          </p>
          <div id="qr-reader-div" className="qr-reader-container" />
          {!scanning && !scanError && (
            <div className="qr-loading">
              <IonSpinner name="crescent" />
              <p>Starting camera…</p>
            </div>
          )}
          {scanError && <p className="qr-error-msg">{scanError}</p>}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={3500}
        color={toastColor}
        position="top"
      />
    </div>
  );
};

export default AttendanceCheckIn;
