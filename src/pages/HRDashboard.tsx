import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonButton,
  IonTextarea,
  IonInput,
  IonModal,
  IonButtons,
  IonMenuButton,
  IonSplitPane,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
} from '@ionic/react';
import { chevronDownOutline, chevronUpOutline, calendarOutline, qrCodeOutline, refreshOutline, barChartOutline, createOutline, timeOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { employeeService, Employee } from '../api/employeeService';
import { leaveService, Leave, LeaveBalance } from '../api/leaveService';
import { attendanceService, DailyRecord, MonthlySummary, QRToken } from '../api/attendanceService';
import { regularizationService, RegularizationRequest } from '../api/attendanceRegularizationService';
import { QRCodeCanvas } from 'qrcode.react';
import SideNavigation from '../components/SideNavigation';
import ProfileSection from '../components/ProfileSection';
import ProfileChangeRequests from '../components/ProfileChangeRequests';
import ShiftManagement from '../components/ShiftManagement';
import './HRDashboard.css';

const HRDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'overview' | 'employees' | 'leaves' | 'requests' | 'balances' | 'attendance' | 'shifts'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  
  // Leave approval modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [leaveAction, setLeaveAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [hrComments, setHrComments] = useState('');

  // Leave balance state
  const [allBalances, setAllBalances] = useState<LeaveBalance[]>([]);
  const [expandedBalanceId, setExpandedBalanceId] = useState<string | null>(null);
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);
  const [editLeaveType, setEditLeaveType] = useState('');
  const [editAllocated, setEditAllocated] = useState<number>(0);

  // Attendance state
  const [attendanceTab, setAttendanceTab] = useState<'daily' | 'monthly' | 'qr' | 'regularization'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [qrToken, setQrToken] = useState<QRToken | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [markingAbsent, setMarkingAbsent] = useState(false);

  // Attendance admin-edit state
  const [editRecord, setEditRecord] = useState<DailyRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Regularization state
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>([]);
  const [loadingRegularization, setLoadingRegularization] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [regComments, setRegComments] = useState('');
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
  });

  useEffect(() => {
    if (activeSection !== 'profile') {
      loadData();
    }
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'overview') {
        const [empStats, leaveStats] = await Promise.all([
          employeeService.getEmployeeStats(),
          leaveService.getLeaveStats(),
        ]);
        setStats({
          totalEmployees: empStats.totalEmployees,
          activeEmployees: empStats.activeEmployees,
          pendingLeaves: leaveStats.pendingLeaves,
          approvedLeaves: leaveStats.approvedLeaves,
        });
      } else if (activeSection === 'employees') {
        const employeesData = await employeeService.getAllEmployees();
        setEmployees(employeesData);
      } else if (activeSection === 'leaves') {
        const leavesData = await leaveService.getAllLeaves();
        setLeaves(leavesData);
      } else if (activeSection === 'balances') {
        const balancesData = await leaveService.getAllBalances();
        setAllBalances(balancesData);
      } else if (activeSection === 'attendance') {
        // load initial daily view
        await loadDailyAttendance(selectedDate);
        await loadQRToken();
      }
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to load data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleLeaveAction = (leave: Leave, action: 'Approved' | 'Rejected') => {
    setSelectedLeave(leave);
    setLeaveAction(action);
    setHrComments('');
    setShowLeaveModal(true);
  };

  const confirmLeaveAction = async () => {
    if (!selectedLeave) return;

    setLoading(true);
    try {
      await leaveService.updateLeaveStatus(selectedLeave._id, {
        status: leaveAction,
        hrComments: hrComments,
      });
      showMessage(`Leave ${leaveAction.toLowerCase()} successfully`, 'success');
      setShowLeaveModal(false);
      loadData();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to update leave status', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyAttendance = async (date: string) => {
    setLoadingAttendance(true);
    try {
      const data = await attendanceService.getDailyAttendance(date);
      setDailyRecords(data);
    } catch (_) {}
    finally { setLoadingAttendance(false); }
  };

  const loadMonthlySummary = async (month: number, year: number) => {
    setLoadingAttendance(true);
    try {
      const data = await attendanceService.getMonthlySummary(month, year);
      setMonthlySummary(data);
    } catch (_) {}
    finally { setLoadingAttendance(false); }
  };

  const loadQRToken = async () => {
    try {
      const t = await attendanceService.getQRToken();
      setQrToken(t);
    } catch (_) {}
  };
  const handleMarkAbsent = async (date: string) => {
    setMarkingAbsent(true);
    try {
      const result = await attendanceService.markAbsent(date);
      if (result.skipped === 'weekend') {
        showMessage('Skipped — this is a weekend', 'warning');
      } else {
        showMessage(
          result.marked > 0
            ? `${result.marked} employee(s) marked as absent for ${result.date}`
            : `All employees already have an attendance record for ${result.date}`,
          result.marked > 0 ? 'success' : 'warning'
        );
        // Refresh daily view to show the new absent records
        await loadDailyAttendance(date);
      }
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to mark absent', 'danger');
    } finally {
      setMarkingAbsent(false);
    }
  };
  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    try {
      const t = await attendanceService.generateQRToken();
      setQrToken(t);
    } catch (_) {}
    finally { setGeneratingQR(false); }
  };

  const openAttendanceEdit = (rec: DailyRecord) => {
    setEditRecord(rec);
    const att = rec.attendance;
    setEditCheckIn(att?.checkIn?.time ? new Date(att.checkIn.time).toTimeString().slice(0, 5) : '');
    setEditCheckOut(att?.checkOut?.time ? new Date(att.checkOut.time).toTimeString().slice(0, 5) : '');
    setEditStatus(att?.status || 'present');
  };

  const saveAttendanceEdit = async () => {
    if (!editRecord) return;
    setSavingEdit(true);
    try {
      await attendanceService.adminUpdateAttendance({
        employeeId: editRecord.employee._id,
        date: selectedDate,
        checkInTime: editCheckIn || undefined,
        checkOutTime: editCheckOut || undefined,
        status: editStatus || undefined,
      });
      showMessage('Attendance record updated', 'success');
      setEditRecord(null);
      await loadDailyAttendance(selectedDate);
    } catch (e: any) {
      showMessage(e.response?.data?.message || 'Update failed', 'danger');
    } finally {
      setSavingEdit(false);
    }
  };

  const loadRegularizationRequests = async () => {
    setLoadingRegularization(true);
    try {
      const data = await regularizationService.getAllRequests();
      setRegularizationRequests(data);
    } catch (_) {}
    finally { setLoadingRegularization(false); }
  };

  const handleReviewRequest = async (id: string, action: 'approved' | 'rejected', comments: string) => {
    setReviewingId(id);
    try {
      await regularizationService.reviewRequest(id, { status: action, hrComments: comments });
      showMessage(`Request ${action}`, action === 'approved' ? 'success' : 'warning');
      setReviewTarget(null);
      setRegComments('');
      await loadRegularizationRequests();
    } catch (e: any) {
      showMessage(e.response?.data?.message || 'Review failed', 'danger');
    } finally {
      setReviewingId(null);
    }
  };

  const openEditBalance = (balance: LeaveBalance, leaveType: string, currentAllocated: number) => {
    setEditingBalance(balance);
    setEditLeaveType(leaveType);
    setEditAllocated(currentAllocated);
    setShowEditBalanceModal(true);
  };

  const confirmEditBalance = async () => {
    if (!editingBalance) return;
    setLoading(true);
    try {
      await leaveService.updateAllocated(editingBalance._id, editLeaveType, editAllocated);
      showMessage('Leave allocation updated successfully', 'success');
      setShowEditBalanceModal(false);
      const balancesData = await leaveService.getAllBalances();
      setAllBalances(balancesData);
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to update allocation', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'medium';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;

      case 'requests':
        return <ProfileChangeRequests />;

      case 'overview':
        return (
          <div className="dashboard-content">
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card total-card">
                    <IonCardContent>
                      <h2>{stats.totalEmployees}</h2>
                      <p>Total Employees</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card active-card">
                    <IonCardContent>
                      <h2>{stats.activeEmployees}</h2>
                      <p>Active Employees</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card pending-card">
                    <IonCardContent>
                      <h2>{stats.pendingLeaves}</h2>
                      <p>Pending Leaves</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card approved-card">
                    <IonCardContent>
                      <h2>{stats.approvedLeaves}</h2>
                      <p>Approved Leaves</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        );

      case 'employees':
        return (
          <div className="employees-section">
            <IonCard className="employees-card">
              <IonCardHeader>
                <IonCardTitle>All Employees ({employees.length})</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  {employees.map((emp) => (
                    <IonItem key={emp._id} className="employee-item">
                      <IonLabel>
                        <h2>{emp.name}</h2>
                        <p>ID: {emp.employeeId} | {emp.department}</p>
                        <p>{emp.designation} | {emp.email}</p>
                      </IonLabel>
                      <IonBadge color={emp.isActive ? 'success' : 'danger'} slot="end">
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>
        );

      case 'leaves':
        return (
          <div className="leaves-section">
            <IonCard className="leaves-card">
              <IonCardHeader>
                <IonCardTitle>Leave Requests ({leaves.length})</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  {leaves.map((leave) => (
                    <IonCard key={leave._id} className="leave-request-card">
                      <IonCardContent>
                        <div className="leave-header">
                          <div>
                            <h3>{leave.employeeId.name} - {leave.leaveType}</h3>
                            <p className="employee-details">
                              {leave.employeeId.employeeId} | {leave.employeeId.department}
                            </p>
                          </div>
                          <IonBadge color={getStatusColor(leave.status)}>
                            {leave.status}
                          </IonBadge>
                        </div>
                        <div className="leave-details">
                          <p className="leave-dates">
                            <strong>Duration:</strong>{' '}
                            {new Date(leave.startDate).toLocaleDateString()} to{' '}
                            {new Date(leave.endDate).toLocaleDateString()} ({leave.numberOfDays} days)
                          </p>
                          <p className="leave-reason">
                            <strong>Reason:</strong> {leave.reason}
                          </p>
                          {leave.hrComments && (
                            <p className="hr-comments-display">
                              <strong>HR Comments:</strong> {leave.hrComments}
                            </p>
                          )}
                          {leave.proofUrl && (
                            <div className="leave-proof">
                              <strong>Proof: </strong>
                              {/\.(jpg|jpeg|png)$/i.test(leave.proofUrl) ? (
                                <a href={`http://localhost:5000${leave.proofUrl}`} target="_blank" rel="noreferrer">
                                  <img
                                    src={`http://localhost:5000${leave.proofUrl}`}
                                    alt="Leave proof"
                                    className="leave-proof-thumb"
                                  />
                                </a>
                              ) : (
                                <a href={`http://localhost:5000${leave.proofUrl}`} target="_blank" rel="noreferrer" className="leave-proof-link">
                                  View PDF Proof
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        {leave.status === 'Pending' && (
                          <div className="leave-actions">
                            <IonButton
                              size="small"
                              color="success"
                              onClick={() => handleLeaveAction(leave, 'Approved')}
                            >
                              Approve
                            </IonButton>
                            <IonButton
                              size="small"
                              color="danger"
                              onClick={() => handleLeaveAction(leave, 'Rejected')}
                            >
                              Reject
                            </IonButton>
                          </div>
                        )}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>
        );

      case 'balances':
        return (
          <div className="balances-section">
            <IonCard className="balances-card">
              <IonCardHeader>
                <IonCardTitle>Leave Balances — {new Date().getFullYear()} ({allBalances.length} employees)</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {allBalances.length === 0 ? (
                  <p className="no-data">No balance records found. Employees are initialised on first login.</p>
                ) : (
                  allBalances.map((bal) => {
                    const emp = bal.employeeId as any;
                    const isExpanded = expandedBalanceId === bal._id;
                    return (
                      <div key={bal._id} className="emp-accordion">
                        <div
                          className={`emp-accordion-header${isExpanded ? ' expanded' : ''}`}
                          onClick={() => setExpandedBalanceId(isExpanded ? null : bal._id)}
                        >
                          <div className="emp-accordion-info">
                            <span className="emp-accordion-name">{emp?.name ?? '—'}</span>
                            <span className="emp-accordion-meta">{emp?.employeeId} · {emp?.department}</span>
                          </div>
                          <IonIcon icon={isExpanded ? chevronUpOutline : chevronDownOutline} className="emp-accordion-chevron" />
                        </div>
                        {isExpanded && (
                          <div className="emp-accordion-body">
                            <div className="balance-table-wrapper">
                              <table className="balance-table">
                                <thead>
                                  <tr>
                                    <th>Leave Type</th>
                                    <th>Allocated</th>
                                    <th>Used</th>
                                    <th>Pending</th>
                                    <th>Remaining</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bal.balances.map((b) => {
                                    const remaining = Math.round((b.allocated - b.used - b.pending) * 2) / 2;
                                    return (
                                      <tr key={b.leaveType}>
                                        <td>{b.leaveType}</td>
                                        <td>{b.allocated}</td>
                                        <td>{b.used}</td>
                                        <td>{b.pending}</td>
                                        <td className={remaining <= 0 ? 'balance-none' : remaining <= b.allocated * 0.3 ? 'balance-low' : 'balance-ok'}>
                                          {remaining}
                                        </td>
                                        <td>
                                          <IonButton
                                            size="small"
                                            color="primary"
                                            fill="outline"
                                            onClick={(e) => { e.stopPropagation(); openEditBalance(bal, b.leaveType, b.allocated); }}
                                          >
                                            Edit
                                          </IonButton>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </IonCardContent>
            </IonCard>
          </div>
        );

      case 'attendance':
        return (
          <div className="hr-attendance-section">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Attendance Management</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonSegment
                  value={attendanceTab}
                  onIonChange={(e) => {
                    const tab = e.detail.value as 'daily' | 'monthly' | 'qr' | 'regularization';
                    setAttendanceTab(tab);
                    if (tab === 'daily') loadDailyAttendance(selectedDate);
                    else if (tab === 'monthly') loadMonthlySummary(attMonth, attYear);
                    else if (tab === 'qr') loadQRToken();
                    else if (tab === 'regularization') loadRegularizationRequests();
                  }}
                  className="att-segment"
                >
                  <IonSegmentButton value="daily">
                    <IonIcon icon={calendarOutline} />
                    <IonLabel>Daily</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="monthly">
                    <IonIcon icon={barChartOutline} />
                    <IonLabel>Monthly</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="qr">
                    <IonIcon icon={qrCodeOutline} />
                    <IonLabel>QR Code</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="regularization">
                    <IonIcon icon={timeOutline} />
                    <IonLabel>Corrections</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </IonCardContent>
            </IonCard>

            {/* ── Daily View ── */}
            {attendanceTab === 'daily' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Daily Attendance</IonCardTitle>
                  <IonButton
                    size="small"
                    color="warning"
                    fill="outline"
                    disabled={markingAbsent}
                    onClick={() => handleMarkAbsent(selectedDate)}
                    style={{ marginTop: '8px' }}
                  >
                    {markingAbsent ? <IonSpinner name="crescent" /> : 'Mark Absent'}
                  </IonButton>
                </IonCardHeader>
                <IonCardContent>
                  <div className="att-date-row">
                    <input
                      type="date"
                      className="att-date-input"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        loadDailyAttendance(e.target.value);
                      }}
                    />
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => loadDailyAttendance(selectedDate)}
                    >
                      <IonIcon slot="icon-only" icon={refreshOutline} />
                    </IonButton>
                  </div>
                  {loadingAttendance ? (
                    <div className="att-loading"><IonSpinner name="crescent" /></div>
                  ) : dailyRecords.length === 0 ? (
                    <p className="att-empty">No records found for this date</p>
                  ) : (
                    <div className="att-table-wrap">
                      <table className="att-hr-table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Dept</th>
                            <th>Status</th>
                            <th>Check In</th>
                            <th>Via</th>
                            <th>Check Out</th>
                            <th>Hours</th>
                            <th>Edit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyRecords.map((rec) => (
                            <tr key={rec.employee._id}>
                              <td>
                                <div className="att-emp-name">{rec.employee.name}</div>
                                <div className="att-emp-id">{rec.employee.employeeId}</div>
                              </td>
                              <td>{rec.employee.department || '—'}</td>
                              <td>
                                <IonBadge
                                  color={
                                    rec.status === 'present'
                                      ? 'success'
                                      : rec.status === 'late'
                                      ? 'warning'
                                      : rec.status === 'half-day'
                                      ? 'tertiary'
                                      : rec.status === 'on-leave'
                                      ? 'primary'
                                      : 'danger'
                                  }
                                >
                                  {rec.status.replace(/-/g, ' ')}
                                </IonBadge>
                              </td>
                              <td>
                                {rec.attendance?.checkIn?.time
                                  ? new Date(rec.attendance.checkIn.time).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </td>
                              <td>
                                {rec.attendance?.checkIn?.method ? (
                                  <span className="att-via-chip">
                                    {rec.attendance.checkIn.method.toUpperCase()}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>
                                {rec.attendance?.checkOut?.time
                                  ? new Date(rec.attendance.checkOut.time).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </td>
                              <td>
                                {rec.attendance?.workingHours
                                  ? `${rec.attendance.workingHours}h`
                                  : '—'}
                              </td>
                              <td>
                                <IonButton fill="clear" size="small" onClick={() => openAttendanceEdit(rec)}>
                                  <IonIcon slot="icon-only" icon={createOutline} />
                                </IonButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {/* ── Monthly Summary ── */}
            {attendanceTab === 'monthly' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Monthly Summary</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="att-month-filters">
                    <select
                      className="att-select"
                      value={attMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setAttMonth(m);
                        loadMonthlySummary(m, attYear);
                      }}
                    >
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                      ))}
                    </select>
                    <select
                      className="att-select"
                      value={attYear}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setAttYear(y);
                        loadMonthlySummary(attMonth, y);
                      }}
                    >
                      {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {loadingAttendance ? (
                    <div className="att-loading"><IonSpinner name="crescent" /></div>
                  ) : monthlySummary.length === 0 ? (
                    <p className="att-empty">No data for this period</p>
                  ) : (
                    <div className="att-table-wrap">
                      <table className="att-hr-table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Dept</th>
                            <th>Present</th>
                            <th>Late</th>
                            <th>Half Day</th>
                            <th>On Leave</th>
                            <th>Absent</th>
                            <th>Total Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlySummary.map((s) => (
                            <tr key={s._id}>
                              <td>
                                <div className="att-emp-name">{s.name}</div>
                                <div className="att-emp-id">{s.employeeId}</div>
                              </td>
                              <td>{s.department || '—'}</td>
                              <td><IonBadge color="success">{s.present}</IonBadge></td>
                              <td><IonBadge color="warning">{s.late}</IonBadge></td>
                              <td><IonBadge color="tertiary">{s.halfDay}</IonBadge></td>
                              <td><IonBadge color="primary">{s.onLeave ?? 0}</IonBadge></td>
                              <td><IonBadge color="danger">{s.absent}</IonBadge></td>
                              <td>{s.totalWorkingHours}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {/* ── Edit Attendance Modal ── */}
            <IonModal isOpen={!!editRecord} onDidDismiss={() => setEditRecord(null)}>
              <IonHeader>
                <IonToolbar>
                  <IonTitle>Edit Attendance — {editRecord?.employee.name}</IonTitle>
                  <IonButtons slot="end">
                    <IonButton onClick={() => setEditRecord(null)}>Cancel</IonButton>
                  </IonButtons>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                <p style={{ color: 'var(--ion-color-medium)' }}>Date: {selectedDate}</p>
                <IonItem>
                  <IonLabel position="stacked">Check-In Time</IonLabel>
                  <IonInput type="time" value={editCheckIn} onIonInput={(e) => setEditCheckIn(e.detail.value || '')} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Check-Out Time</IonLabel>
                  <IonInput type="time" value={editCheckOut} onIonInput={(e) => setEditCheckOut(e.detail.value || '')} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Status</IonLabel>
                  <select
                    className="att-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ margin: '8px 0' }}
                  >
                    {['present', 'late', 'half-day', 'absent', 'on-leave'].map((s) => (
                      <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </IonItem>
                <div style={{ padding: '16px 0' }}>
                  <IonButton expand="block" onClick={saveAttendanceEdit} disabled={savingEdit}>
                    {savingEdit ? <IonSpinner name="crescent" /> : 'Save Changes'}
                  </IonButton>
                </div>
              </IonContent>
            </IonModal>

            {/* ── QR Code ── */}
            {attendanceTab === 'qr' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Daily QR Code</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p className="att-qr-hint">
                    Generate a QR code for today. Employees scan it to mark in-office attendance.
                  </p>
                  <div className="att-qr-actions">
                    <IonButton
                      color="primary"
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                    >
                      {generatingQR ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <>
                          <IonIcon icon={refreshOutline} slot="start" />
                          {qrToken ? 'Regenerate QR' : 'Generate QR'}
                        </>
                      )}
                    </IonButton>
                  </div>
                  {qrToken && (
                    <div className="att-qr-display">
                      <QRCodeCanvas value={qrToken.token} size={220} level="H" />
                      <p className="att-qr-date">
                        Valid for:{' '}
                        {new Date(qrToken.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="att-qr-expires">
                        Expires at midnight
                      </p>
                    </div>
                  )}
                  {!qrToken && !generatingQR && (
                    <p className="att-empty">No QR code generated for today yet</p>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {/* ── Regularization / Correction Requests ── */}
            {attendanceTab === 'regularization' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Attendance Correction Requests</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {loadingRegularization ? (
                    <div className="att-loading"><IonSpinner name="crescent" /></div>
                  ) : regularizationRequests.length === 0 ? (
                    <p className="att-empty">No correction requests found</p>
                  ) : (
                    regularizationRequests.map((req) => (
                      <IonCard key={req._id} style={{ marginBottom: '12px' }}>
                        <IonCardContent>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{(req.employeeId as any)?.name || 'Employee'}</strong>
                              <span style={{ marginLeft: '8px', color: 'var(--ion-color-medium)', fontSize: '0.85em' }}>
                                {(req.employeeId as any)?.employeeId}
                              </span>
                            </div>
                            <IonBadge color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}>
                              {req.status}
                            </IonBadge>
                          </div>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Date:</strong> {new Date(req.date).toLocaleDateString('en-GB')}
                          </p>
                          {req.requestedCheckIn && (
                            <p style={{ margin: '4px 0' }}>
                              <strong>Requested Check-In:</strong> {req.requestedCheckIn}
                            </p>
                          )}
                          {req.requestedCheckOut && (
                            <p style={{ margin: '4px 0' }}>
                              <strong>Requested Check-Out:</strong> {req.requestedCheckOut}
                            </p>
                          )}
                          <p style={{ margin: '4px 0' }}><strong>Reason:</strong> {req.reason}</p>
                          {req.status === 'pending' && (
                            <div style={{ marginTop: '8px' }}>
                              {reviewTarget?.id === req._id ? (
                                <>
                                  <IonItem>
                                    <IonLabel position="stacked">HR Comments (optional)</IonLabel>
                                    <IonInput
                                      value={regComments}
                                      onIonInput={(e) => setRegComments(e.detail.value || '')}
                                      placeholder="Add a comment..."
                                    />
                                  </IonItem>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <IonButton
                                      color="success"
                                      size="small"
                                      disabled={reviewingId === req._id}
                                      onClick={() => handleReviewRequest(req._id, 'approved', regComments)}
                                    >
                                      {reviewingId === req._id ? <IonSpinner name="crescent" /> : <><IonIcon icon={checkmarkOutline} slot="start" />Approve</>}
                                    </IonButton>
                                    <IonButton
                                      color="danger"
                                      size="small"
                                      disabled={reviewingId === req._id}
                                      onClick={() => handleReviewRequest(req._id, 'rejected', regComments)}
                                    >
                                      {reviewingId === req._id ? <IonSpinner name="crescent" /> : <><IonIcon icon={closeOutline} slot="start" />Reject</>}
                                    </IonButton>
                                    <IonButton
                                      color="medium"
                                      size="small"
                                      fill="clear"
                                      onClick={() => { setReviewTarget(null); setRegComments(''); }}
                                    >
                                      Cancel
                                    </IonButton>
                                  </div>
                                </>
                              ) : (
                                <IonButton
                                  size="small"
                                  onClick={() => setReviewTarget({ id: req._id, action: 'approved' })}
                                >
                                  Review
                                </IonButton>
                              )}
                            </div>
                          )}
                          {req.hrComments && (
                            <p style={{ margin: '8px 0 0', color: 'var(--ion-color-medium)', fontSize: '0.85em' }}>
                              <strong>HR Note:</strong> {req.hrComments}
                            </p>
                          )}
                        </IonCardContent>
                      </IonCard>
                    ))
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </div>
        );

      case 'shifts':
        return <ShiftManagement />;

      default:
        return null;
    }
  };

  return (
    <IonSplitPane contentId="hr-main" when="lg">
      <SideNavigation
        contentId="hr-main"
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as any)}
      />
      
      <IonPage id="hr-main">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>HR Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="hr-dashboard-content" scrollY={true}>
          {renderContent()}

          {/* Leave Action Modal */}
          <IonModal isOpen={showLeaveModal} onDidDismiss={() => setShowLeaveModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>{leaveAction} Leave Request</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowLeaveModal(false)}>Close</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" scrollY={true}>
              {selectedLeave && (
                <>
                  <IonCard>
                    <IonCardContent>
                      <p><strong>Employee:</strong> {selectedLeave.employeeId.name}</p>
                      <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                      <p><strong>Duration:</strong> {selectedLeave.numberOfDays} days</p>
                      <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                    </IonCardContent>
                  </IonCard>

                  <IonItem>
                    <IonLabel position="stacked">HR Comments (Optional)</IonLabel>
                    <IonTextarea
                      value={hrComments}
                      onIonChange={(e) => setHrComments(e.detail.value || '')}
                      placeholder="Add any comments..."
                      rows={4}
                    />
                  </IonItem>

                  <IonButton
                    expand="block"
                    color={leaveAction === 'Approved' ? 'success' : 'danger'}
                    onClick={confirmLeaveAction}
                    style={{ marginTop: '20px' }}
                  >
                    Confirm {leaveAction}
                  </IonButton>
                </>
              )}
            </IonContent>
          </IonModal>

          {/* Edit Balance Modal */}
          <IonModal isOpen={showEditBalanceModal} onDidDismiss={() => setShowEditBalanceModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Edit Allocation</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowEditBalanceModal(false)}>Close</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" scrollY={true}>
              {editingBalance && (
                <>
                  <IonCard>
                    <IonCardContent>
                      <p><strong>Employee:</strong> {(editingBalance.employeeId as any)?.name}</p>
                      <p><strong>Leave Type:</strong> {editLeaveType}</p>
                    </IonCardContent>
                  </IonCard>
                  <IonItem>
                    <IonLabel position="stacked">Allocated Days</IonLabel>
                    <IonInput
                      type="number"
                      value={editAllocated}
                      min={0}
                      onIonInput={(e) => setEditAllocated(Number(e.detail.value) || 0)}
                    />
                  </IonItem>
                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={confirmEditBalance}
                    style={{ marginTop: '20px' }}
                  >
                    Save
                  </IonButton>
                </>
              )}
            </IonContent>
          </IonModal>

          <IonLoading isOpen={loading} message="Loading..." />
          
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
            color={toastColor}
          />
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default HRDashboard;