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
  IonText,
  IonBadge,
} from '@ionic/react';
import { serviceTicketService } from '../api/serviceTicketService';
import SideNavigation from '../components/SideNavigation';
import ProfileSection from '../components/ProfileSection';
import ServiceTicketManagement from './ServiceTicketManagement';
import './EmployeeDashboard.css';

interface Statistics {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

const ServiceEngineerDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'profile' | 'dashboard' | 'service-tickets'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const [stats, setStats] = useState<Statistics>({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await serviceTicketService.getStatistics();
      setStats(response.statistics);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Failed to load statistics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;

      case 'dashboard':
        return (
          <div className="dashboard-content">
            <IonGrid>
              {/* Ticket Statistics */}
              <IonRow>
                <IonCol size="12">
                  <h2 style={{ marginBottom: '1rem' }}>Your Assigned Tickets Overview</h2>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card total-card">
                    <IonCardContent>
                      <h2>{stats.assigned}</h2>
                      <p>Assigned to Me</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card progress">
                    <IonCardContent>
                      <h2>{stats.inProgress}</h2>
                      <p>In Progress</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card resolved-card">
                    <IonCardContent>
                      <h2>{stats.resolved}</h2>
                      <p>Resolved</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="stat-card closed-card">
                    <IonCardContent>
                      <h2>{stats.closed}</h2>
                      <p>Closed</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {/* Quick Stats Summary */}
              <IonRow>
                <IonCol size="12">
                  <IonCard>
                    <IonCardContent>
                      <h3 style={{ marginTop: 0 }}>Quick Summary</h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem',
                        marginTop: '1rem'
                      }}>
                        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Active Assignments</p>
                          <h3 style={{ margin: '0.5rem 0 0 0', color: '#1976d2' }}>
                            {stats.assigned + stats.inProgress}
                          </h3>
                        </div>
                        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Completion Rate</p>
                          <h3 style={{ margin: '0.5rem 0 0 0', color: '#4caf50' }}>
                            {stats.assigned + stats.inProgress + stats.resolved > 0
                              ? Math.round((stats.resolved / (stats.assigned + stats.inProgress + stats.resolved)) * 100)
                              : 0}%
                          </h3>
                        </div>
                        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Awaiting Action</p>
                          <h3 style={{ margin: '0.5rem 0 0 0', color: '#ff9800' }}>
                            {stats.assigned}
                          </h3>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {/* Information Card */}
              <IonRow>
                <IonCol size="12">
                  <IonCard>
                    <IonCardContent>
                      <h3 style={{ marginTop: 0 }}>Your Role</h3>
                      <IonText>
                        <p>
                          As a Service Engineer, you are responsible for handling and resolving assigned service tickets.
                          Your responsibilities include:
                        </p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                          <li>View your assigned tickets in the "My Tickets" section</li>
                          <li>Update ticket status as you progress</li>
                          <li>Upload proof of work and completion details</li>
                          <li>Add work notes and comments to tickets</li>
                          <li>Communicate with employees through ticket comments</li>
                        </ul>
                      </IonText>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        );

      case 'service-tickets':
        return <ServiceTicketManagement />;

      default:
        return (
          <div className="dashboard-content">
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <h2>Welcome, Service Engineer!</h2>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        );
    }
  };

  return (
    <IonSplitPane contentId="engineer-main" when="lg">
      <SideNavigation
        contentId="engineer-main"
        activeSection={activeSection}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSectionChange={(section) => setActiveSection(section as any)}
      />

      <IonPage id="engineer-main">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Service Engineer Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent
          className="employee-dashboard-content"
          scrollY={true}
        >
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

export default ServiceEngineerDashboard;
