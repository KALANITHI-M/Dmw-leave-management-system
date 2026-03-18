import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonLoading,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonMenuButton,
  IonSplitPane,
} from '@ionic/react';
import { leaveService, Leave, LeaveBalance } from '../api/leaveService';
import SideNavigation from '../components/SideNavigation';
import ProfileSection from '../components/ProfileSection';
import LeaveApplicationForm from '../components/LeaveApplicationForm';
import AppliedLeaves from '../components/AppliedLeaves';
import AttendanceCheckIn from '../components/AttendanceCheckIn';
import AttendanceReport from '../components/AttendanceReport';
import MyShift from '../components/MyShift';
import AttendanceRegularization from '../components/AttendanceRegularization';
import MyTasks from '../components/MyTasks';
import './EmployeeDashboard.css';

const EmployeeDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'profile' | 'apply-leave' | 'applied-leaves' | 'dashboard' | 'attendance' | 'attendance-report' | 'my-shift' | 'attendance-regularization' | 'my-tasks'>('apply-leave');
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });

  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    loadLeaves();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const [leavesData, statsData, balanceData] = await Promise.all([
        leaveService.getMyLeaves(),
        leaveService.getLeaveStats(),
        leaveService.getMyBalance(),
      ]);
      setMyLeaves(leavesData);
      setStats(statsData);
      setLeaveBalance(balanceData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to load leaves', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleDeleteLeave = async (leaveId: string) => {
    setLoading(true);
    try {
      await leaveService.deleteLeave(leaveId);
      showMessage('Leave application deleted successfully', 'success');
      loadLeaves();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to delete leave', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSubmitSuccess = () => {
    loadLeaves();
    setActiveSection('applied-leaves');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      
      case 'apply-leave':
        return <LeaveApplicationForm onSuccess={handleLeaveSubmitSuccess} />;
      
      case 'applied-leaves':
        return <AppliedLeaves leaves={myLeaves} onDelete={handleDeleteLeave} />;
      
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <IonGrid>
              {/* Leave stats */}
              <IonRow>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card total-card">
                    <IonCardContent>
                      <h2>{stats.totalLeaves}</h2>
                      <p>Total Leaves</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card pending-card">
                    <IonCardContent>
                      <h2>{stats.pendingLeaves}</h2>
                      <p>Pending</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card approved-card">
                    <IonCardContent>
                      <h2>{stats.approvedLeaves}</h2>
                      <p>Approved</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card rejected-card">
                    <IonCardContent>
                      <h2>{stats.rejectedLeaves}</h2>
                      <p>Rejected</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {/* Leave balance summary */}
              {leaveBalance && (
                <IonRow>
                  <IonCol size="12">
                    <IonCard className="balance-summary-card">
                      <IonCardContent>
                        <h3 className="balance-summary-title">
                          Leave Balance — {leaveBalance.year}
                        </h3>
                        <div className="balance-table-wrapper">
                          <table className="balance-table">
                            <thead>
                              <tr>
                                <th>Leave Type</th>
                                <th>Allocated</th>
                                <th>Used</th>
                                <th>Pending</th>
                                <th>Remaining</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaveBalance.balances.map((b) => {
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
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </div>
        );
      
      case 'attendance':
        return <AttendanceCheckIn />;

      case 'attendance-report':
        return <AttendanceReport />;

      case 'my-shift':
        return <MyShift />;

      case 'attendance-regularization':
        return <AttendanceRegularization />;

      case 'my-tasks':
        return <MyTasks embedded />;

      default:
        return <LeaveApplicationForm onSuccess={handleLeaveSubmitSuccess} />;
    }
  };

  return (
    <IonSplitPane contentId="employee-main" when="lg">
      <SideNavigation
        contentId="employee-main"
        activeSection={activeSection}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSectionChange={(section) => setActiveSection(section as any)}
      />
      
      <IonPage id="employee-main">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Employee Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="employee-dashboard-content" scrollY={true}>
          {renderContent()}

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

export default EmployeeDashboard;