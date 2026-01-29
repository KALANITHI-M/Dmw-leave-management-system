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
  IonModal,
  IonButtons,
  IonMenuButton,
  IonSplitPane,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { employeeService, Employee } from '../api/employeeService';
import { leaveService, Leave } from '../api/leaveService';
import SideNavigation from '../components/SideNavigation';
import ProfileSection from '../components/ProfileSection';
import './HRDashboard.css';

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'overview' | 'employees' | 'leaves'>('overview');
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

  const handleLogout = () => {
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
        
        <IonContent className="hr-dashboard-content">
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
            <IonContent className="ion-padding">
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