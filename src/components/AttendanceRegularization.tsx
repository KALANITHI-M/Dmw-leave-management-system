import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonToast,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonDatetime,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  timeOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  calendarOutline,
  listOutline,
} from 'ionicons/icons';
import { attendanceService, Attendance } from '../api/attendanceService';
import {
  regularizationService,
  RegularizationRequest,
} from '../api/attendanceRegularizationService';
import './AttendanceRegularization.css';

const AttendanceRegularization: React.FC = () => {
  // ── Tabs ────────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'records' | 'myrequests'>('records');

  // ── Attendance records (for picking) ──────────────────────────────────────────
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recMonth, setRecMonth] = useState(new Date().getMonth() + 1);
  const [recYear, setRecYear] = useState(new Date().getFullYear());

  // ── My submitted requests ───────────────────────────────────────────────────
  const [requests, setRequests] = useState<RegularizationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // ── Correction modal ──────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [correctedCheckIn, setCorrectedCheckIn] = useState('');
  const [correctedCheckOut, setCorrectedCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────────────
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    loadRecords(recMonth, recYear);
  }, []);

  useEffect(() => {
    if (tab === 'myrequests') loadRequests();
  }, [tab]);

  const loadRecords = async (month: number, year: number) => {
    setLoadingRecords(true);
    try {
      const data = await attendanceService.getMyAttendance(month, year);
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(data);
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to load attendance', 'danger');
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await regularizationService.getMyRequests();
      setRequests(data);
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to load requests', 'danger');
    } finally {
      setLoadingRequests(false);
    }
  };

  const notify = (msg: string, color: 'success' | 'danger' = 'success') => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  };

  const openCorrection = (rec: Attendance) => {
    setSelectedRecord(rec);
    setCorrectedCheckIn(
      rec.checkIn?.time ? new Date(rec.checkIn.time).toTimeString().slice(0, 5) : ''
    );
    setCorrectedCheckOut(
      rec.checkOut?.time ? new Date(rec.checkOut.time).toTimeString().slice(0, 5) : ''
    );
    setReason('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedRecord) return;
    if (!reason.trim()) {
      notify('Please enter a reason for the correction', 'danger');
      return;
    }
    if (!correctedCheckIn && !correctedCheckOut) {
      notify('Please correct at least one time (check-in or check-out)', 'danger');
      return;
    }
    setSubmitting(true);
    try {
      await regularizationService.createRequest({
        date: selectedRecord.date.split('T')[0],
        requestedCheckIn: correctedCheckIn || undefined,
        requestedCheckOut: correctedCheckOut || undefined,
        reason: reason.trim(),
      });
      notify('Correction request submitted — HR will review it shortly');
      setShowModal(false);
      setSelectedRecord(null);
      setTab('myrequests');
      loadRequests();
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to submit request', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtTime = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const fmtHHMM = (hhmm: string) => {
    if (!hhmm) return '—';
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statusColor = (s: string) => {
    if (s === 'present') return 'success';
    if (s === 'late') return 'warning';
    if (s === 'half-day') return 'tertiary';
    if (s === 'on-leave') return 'primary';
    return 'danger';
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = [new Date().getFullYear() - 1, new Date().getFullYear()];

  const hasPendingRequest = (rec: Attendance) =>
    requests.some(
      (r) =>
        r.status === 'pending' &&
        new Date(r.date).toISOString().split('T')[0] === new Date(rec.date).toISOString().split('T')[0]
    );

  return (
    <div className="att-regularization">
      {/* ── Tabs ── */}
      <IonCard>
        <IonCardContent style={{ paddingBottom: 0 }}>
          <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as 'records' | 'myrequests')}>
            <IonSegmentButton value="records">
              <IonIcon icon={calendarOutline} />
              <IonLabel>My Attendance</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="myrequests">
              <IonIcon icon={listOutline} />
              <IonLabel>My Requests</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonCardContent>
      </IonCard>

      {/* ═══ TAB 1 — ATTENDANCE RECORDS ═══ */}
      {tab === 'records' && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Select a Record to Correct</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="reg-tab-hint">
              Tap <strong>Correct</strong> on any record that has a wrong or missing check-in / check-out time.
            </p>
            <div className="reg-month-filter">
              <select className="reg-select" value={recMonth}
                onChange={(e) => { const m = Number(e.target.value); setRecMonth(m); loadRecords(m, recYear); }}>
                {months.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
              </select>
              <select className="reg-select" value={recYear}
                onChange={(e) => { const y = Number(e.target.value); setRecYear(y); loadRecords(recMonth, y); }}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {loadingRecords ? (
              <div className="reg-spinner"><IonSpinner /></div>
            ) : records.length === 0 ? (
              <div className="reg-empty">
                <IonIcon icon={calendarOutline} className="reg-empty-icon" />
                <p>No attendance records found for this period.</p>
              </div>
            ) : (
              records.map((rec) => {
                const pending = hasPendingRequest(rec);
                return (
                  <div key={rec._id} className="reg-rec-card">
                    <div className="reg-rec-left">
                      <span className="reg-rec-date">{fmtDate(rec.date)}</span>
                      <IonBadge color={statusColor(rec.status)} className="reg-badge">
                        {rec.status.replace(/-/g, ' ')}
                      </IonBadge>
                      <div className="reg-rec-times">
                        <span className="reg-rec-time-pair">
                          <IonIcon icon={timeOutline} /> In: <strong>{fmtTime(rec.checkIn?.time)}</strong>
                        </span>
                        <span className="reg-rec-time-pair">
                          Out: <strong>{fmtTime(rec.checkOut?.time)}</strong>
                        </span>
                        {rec.workingHours ? <span className="reg-rec-hours">{rec.workingHours}h worked</span> : null}
                      </div>
                    </div>
                    <div className="reg-rec-right">
                      {pending ? (
                        <IonBadge color="warning" style={{ fontSize: '11px', padding: '4px 8px' }}>Pending</IonBadge>
                      ) : (
                        <IonButton size="small" color="primary" fill="outline" onClick={() => openCorrection(rec)}>
                          <IonIcon icon={createOutline} slot="start" />
                          Correct
                        </IonButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </IonCardContent>
        </IonCard>
      )}

      {/* ═══ TAB 2 — MY SUBMITTED REQUESTS ═══ */}
      {tab === 'myrequests' && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>My Correction Requests</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loadingRequests ? (
              <div className="reg-spinner"><IonSpinner /></div>
            ) : requests.length === 0 ? (
              <div className="reg-empty">
                <IonIcon icon={listOutline} className="reg-empty-icon" />
                <p>No correction requests yet.</p>
                <p className="reg-empty-sub">Go to "My Attendance" tab and tap Correct on a record.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req._id} className="reg-item-card">
                  <div className="reg-item-header">
                    <span className="reg-item-date">{fmtDate(req.date)}</span>
                    <IonBadge color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'} className="reg-badge">
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </IonBadge>
                  </div>
                  <div className="reg-item-body">
                    <div className="reg-time-row">
                      <span className="reg-time-label">Requested In:</span>
                      <span className="reg-time-val">{fmtTime(req.requestedCheckIn)}</span>
                      <span className="reg-time-label" style={{ marginLeft: 12 }}>Out:</span>
                      <span className="reg-time-val">{fmtTime(req.requestedCheckOut)}</span>
                    </div>
                    <div className="reg-reason"><strong>Reason: </strong>{req.reason}</div>
                    {req.hrComments && (
                      <div className="reg-hr-comments"><strong>HR Note: </strong>{req.hrComments}</div>
                    )}
                    {req.reviewedBy && typeof req.reviewedBy !== 'string' && req.reviewedAt && (
                      <div className="reg-reviewed-by">
                        {req.status === 'approved'
                          ? <IonIcon icon={checkmarkOutline} color="success" />
                          : <IonIcon icon={closeOutline} color="danger" />}{' '}
                        {req.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                        {(req.reviewedBy as any).name} on {fmtDate(req.reviewedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </IonCardContent>
        </IonCard>
      )}

      {/* ═══ CORRECTION MODAL ═══ */}
      <IonModal isOpen={showModal} onDidDismiss={() => { setShowModal(false); setSelectedRecord(null); }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Correct Attendance</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selectedRecord && (
            <>
              <div className="req-selected-summary">
                <p className="req-selected-date">{fmtDate(selectedRecord.date)}</p>
                <div className="req-selected-row">
                  <span className="req-selected-label">Current Check-In</span>
                  <span className="req-selected-val">{fmtTime(selectedRecord.checkIn?.time)}</span>
                </div>
                <div className="req-selected-row">
                  <span className="req-selected-label">Current Check-Out</span>
                  <span className="req-selected-val">{fmtTime(selectedRecord.checkOut?.time)}</span>
                </div>
                <div className="req-selected-row">
                  <span className="req-selected-label">Status</span>
                  <IonBadge color={statusColor(selectedRecord.status)}>
                    {selectedRecord.status.replace(/-/g, ' ')}
                  </IonBadge>
                </div>
              </div>

              <p className="req-hint">Set the correct times below and add a reason.</p>

              <div className="req-field-group">
                <label className="req-field-label">Correct Check-In Time</label>
                <button className="req-picker-btn" onClick={() => setShowCheckInPicker(true)}>
                  <span className={correctedCheckIn ? 'req-picker-val' : 'req-picker-placeholder'}>
                    {correctedCheckIn ? fmtHHMM(correctedCheckIn) : 'Tap to set time'}
                  </span>
                  <IonIcon icon={timeOutline} className="req-picker-icon" />
                </button>
                <IonModal isOpen={showCheckInPicker} onDidDismiss={() => setShowCheckInPicker(false)} className="req-picker-modal">
                  <IonContent>
                    <IonDatetime
                      presentation="time"
                      value={correctedCheckIn ? `1970-01-01T${correctedCheckIn}:00` : undefined}
                      onIonChange={(e) => {
                        const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                        setCorrectedCheckIn((val as string)?.split('T')[1]?.slice(0, 5) || '');
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ padding: '8px 16px 16px' }}>
                      <IonButton expand="block" onClick={() => setShowCheckInPicker(false)}>Done</IonButton>
                    </div>
                  </IonContent>
                </IonModal>
              </div>

              <div className="req-field-group">
                <label className="req-field-label">Correct Check-Out Time</label>
                <button className="req-picker-btn" onClick={() => setShowCheckOutPicker(true)}>
                  <span className={correctedCheckOut ? 'req-picker-val' : 'req-picker-placeholder'}>
                    {correctedCheckOut ? fmtHHMM(correctedCheckOut) : 'Tap to set time'}
                  </span>
                  <IonIcon icon={timeOutline} className="req-picker-icon" />
                </button>
                <IonModal isOpen={showCheckOutPicker} onDidDismiss={() => setShowCheckOutPicker(false)} className="req-picker-modal">
                  <IonContent>
                    <IonDatetime
                      presentation="time"
                      value={correctedCheckOut ? `1970-01-01T${correctedCheckOut}:00` : undefined}
                      onIonChange={(e) => {
                        const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                        setCorrectedCheckOut((val as string)?.split('T')[1]?.slice(0, 5) || '');
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ padding: '8px 16px 16px' }}>
                      <IonButton expand="block" onClick={() => setShowCheckOutPicker(false)}>Done</IonButton>
                    </div>
                  </IonContent>
                </IonModal>
              </div>

              <IonItem lines="full" style={{ marginBottom: '16px' }}>
                <IonLabel position="stacked">Reason for Correction *</IonLabel>
                <IonTextarea
                  rows={3}
                  placeholder="e.g. Forgot to check out, system was offline, worked remotely..."
                  value={reason}
                  onIonInput={(e) => setReason(e.detail.value || '')}
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleSubmit}
                disabled={submitting || !reason.trim() || (!correctedCheckIn && !correctedCheckOut)}
              >
                {submitting ? <IonSpinner name="crescent" /> : 'Submit Correction Request'}
              </IonButton>
            </>
          )}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={3500}
        color={toastColor}
        position="bottom"
      />
    </div>
  );
};

export default AttendanceRegularization;
