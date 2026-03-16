import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
} from '@ionic/react';
import { attendanceService, Attendance } from '../api/attendanceService';
import './AttendanceReport.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusColor = (s: string) =>
  ({ present: 'success', late: 'warning', absent: 'danger', 'half-day': 'tertiary' } as Record<
    string,
    string
  >)[s] || 'medium';

const formatTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const AttendanceReport: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getMyAttendance(month, year);
      setRecords(data);
    } catch {
      // ignore
    }
    finally { setLoading(false); }
  };

  const totalPresent = records.filter((r) => r.status === 'present').length;
  const totalLate = records.filter((r) => r.status === 'late').length;
  const totalHalfDay = records.filter((r) => r.status === 'half-day').length;
  const totalHours = records.reduce((a, r) => a + (r.workingHours || 0), 0);

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="att-report">
      {/* Filters */}
      <IonCard className="att-filter-card">
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonItem lines="none">
                  <IonLabel>Month</IonLabel>
                  <IonSelect
                    value={month}
                    onIonChange={(e) => setMonth(e.detail.value)}
                    interface="popover"
                  >
                    {MONTHS.map((m, i) => (
                      <IonSelectOption key={i} value={i + 1}>
                        {m}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
              <IonCol size="6">
                <IonItem lines="none">
                  <IonLabel>Year</IonLabel>
                  <IonSelect
                    value={year}
                    onIonChange={(e) => setYear(e.detail.value)}
                    interface="popover"
                  >
                    {yearOptions.map((y) => (
                      <IonSelectOption key={y} value={y}>
                        {y}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* Summary Stats */}
      <IonGrid className="att-stats-grid">
        <IonRow>
          <IonCol size="6" sizeMd="3">
            <IonCard className="att-stat-card att-stat-present">
              <IonCardContent>
                <h2>{totalPresent}</h2>
                <p>Present</p>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" sizeMd="3">
            <IonCard className="att-stat-card att-stat-late">
              <IonCardContent>
                <h2>{totalLate}</h2>
                <p>Late</p>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" sizeMd="3">
            <IonCard className="att-stat-card att-stat-halfday">
              <IonCardContent>
                <h2>{totalHalfDay}</h2>
                <p>Half Day</p>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" sizeMd="3">
            <IonCard className="att-stat-card att-stat-hours">
              <IonCardContent>
                <h2>{totalHours.toFixed(1)}</h2>
                <p>Total Hours</p>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Records Table */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            Records — {MONTHS[month - 1]} {year}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {records.length === 0 ? (
            <p className="att-no-records">No attendance records for this period</p>
          ) : (
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Via</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>
                        {new Date(r.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          weekday: 'short',
                        })}
                      </td>
                      <td>
                        <IonBadge color={statusColor(r.status)}>
                          {r.status.replace('-', ' ')}
                        </IonBadge>
                      </td>
                      <td>{formatTime(r.checkIn?.time)}</td>
                      <td>
                        {r.checkIn?.method ? (
                          <span className="att-via-chip">{r.checkIn.method.toUpperCase()}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatTime(r.checkOut?.time)}</td>
                      <td>{r.workingHours ? `${r.workingHours}h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      <IonLoading isOpen={loading} message="Loading records…" />
    </div>
  );
};

export default AttendanceReport;
