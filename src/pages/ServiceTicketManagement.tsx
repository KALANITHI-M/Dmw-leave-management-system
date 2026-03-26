import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonLabel,
  IonBadge,
  IonText,
  IonSpinner,
  IonIcon,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonFab,
  IonFabButton,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { add, arrowBack, eye, checkmark } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { serviceTicketService } from '../api/serviceTicketService';
import { useAuth } from '../context/AuthContext';
import './ServiceTicketManagement.css';

interface ServiceTicket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  createdBy?: { name: string; email: string };
  assignedTo?: { name: string; email: string };
  createdAt: string;
  dueDate?: string;
  proofOfWork?: any[];
}

interface Statistics {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  criticalPriority: number;
}

const ServiceTicketManagement: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [allTickets, setAllTickets] = useState<ServiceTicket[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Determine user role
  const userRole = user?.role || 'employee';
  const isServiceEngineer = userRole === 'service engineer';
  const isHR = userRole === 'hr';
  const isEmployee = userRole === 'employee';

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [userRole]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await serviceTicketService.getTickets({});
      setAllTickets(response.tickets);
      setTickets(response.tickets);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await serviceTicketService.getStatistics();
      setStatistics(response.statistics);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = allTickets;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === selectedPriority);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchText) {
      filtered = filtered.filter((t) =>
        t.ticketNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        t.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setTickets(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedStatus, selectedPriority, selectedCategory, searchText, allTickets]);

  const showError = (message: string) => {
    setToastMessage(message);
    setToastColor('danger');
    setShowToast(true);
  };

  const showSuccessMessage = (message: string) => {
    setToastMessage(message);
    setToastColor('success');
    setShowToast(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'medium';
      case 'Assigned':
        return 'primary';
      case 'In Progress':
        return 'warning';
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'dark';
      case 'On Hold':
        return 'secondary';
      default:
        return 'medium';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'danger';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'primary';
      default:
        return 'medium';
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Service Tickets</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            {isServiceEngineer && 'My Assigned Tickets'}
            {isEmployee && !isServiceEngineer && 'My Service Tickets'}
            {isHR && 'Service Ticket Management'}
          </IonTitle>
          <IonButtons slot="end">
            {!isServiceEngineer && (
              <IonButton onClick={() => history.push('/create-service-ticket')} color="primary">
                <IonIcon slot="start" icon={add} />
                {isEmployee && 'New Ticket'}
                {isHR && 'New Ticket'}
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding service-ticket-content">
        {/* Role-Specific Statistics Cards */}
        {statistics && (
          <div className="statistics-grid">
            {/* Service Engineer View - Focused on their assigned work */}
            {isServiceEngineer && (
              <>
                <div className="stat-card total">
                  <div className="stat-label">Assigned to Me</div>
                  <div className="stat-value">{tickets.length}</div>
                </div>
                <div className="stat-card progress">
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">
                    {tickets.filter((t) => t.status === 'In Progress').length}
                  </div>
                </div>
                <div className="stat-card resolved">
                  <div className="stat-label">Resolved</div>
                  <div className="stat-value">
                    {tickets.filter((t) => t.status === 'Resolved').length}
                  </div>
                </div>
              </>
            )}

            {/* Employee View - Shows their created and assigned tickets */}
            {isEmployee && !isServiceEngineer && (
              <>
                <div className="stat-card total">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{statistics.total}</div>
                </div>
                <div className="stat-card open">
                  <div className="stat-label">Open</div>
                  <div className="stat-value">{statistics.open}</div>
                </div>
                <div className="stat-card assigned">
                  <div className="stat-label">Assigned</div>
                  <div className="stat-value">{statistics.assigned}</div>
                </div>
                <div className="stat-card progress">
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{statistics.inProgress}</div>
                </div>
                <div className="stat-card resolved">
                  <div className="stat-label">Resolved</div>
                  <div className="stat-value">{statistics.resolved}</div>
                </div>
                <div className="stat-card closed">
                  <div className="stat-label">Closed</div>
                  <div className="stat-value">{statistics.closed}</div>
                </div>
              </>
            )}

            {/* HR View - Comprehensive statistics for all tickets */}
            {isHR && (
              <>
                <div className="stat-card total">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{statistics.total}</div>
                </div>
                <div className="stat-card open">
                  <div className="stat-label">Open</div>
                  <div className="stat-value">{statistics.open}</div>
                </div>
                <div className="stat-card assigned">
                  <div className="stat-label">Assigned</div>
                  <div className="stat-value">{statistics.assigned}</div>
                </div>
                <div className="stat-card progress">
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{statistics.inProgress}</div>
                </div>
                <div className="stat-card resolved">
                  <div className="stat-label">Resolved</div>
                  <div className="stat-value">{statistics.resolved}</div>
                </div>
                <div className="stat-card closed">
                  <div className="stat-label">Closed</div>
                  <div className="stat-value">{statistics.closed}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Search and Filters - Different for each role */}
        <IonSearchbar
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value || '')}
          placeholder={
            isServiceEngineer
              ? 'Search your assigned tickets...'
              : 'Search by ticket number or title...'
          }
          className="ion-margin-bottom"
          autocapitalize="off"
        />

        {/* Filters - Simplified for Service Engineers */}
        <div className="filter-row">
          <IonSelect
            value={selectedStatus}
            onIonChange={(e) => setSelectedStatus(e.detail.value)}
            placeholder="Filter by Status"
          >
            <IonSelectOption value="all">All Status</IonSelectOption>
            {!isServiceEngineer && <IonSelectOption value="Open">Open</IonSelectOption>}
            {!isServiceEngineer && <IonSelectOption value="Assigned">Assigned</IonSelectOption>}
            <IonSelectOption value="In Progress">In Progress</IonSelectOption>
            <IonSelectOption value="Resolved">Resolved</IonSelectOption>
            {!isServiceEngineer && <IonSelectOption value="Closed">Closed</IonSelectOption>}
          </IonSelect>

          {!isServiceEngineer && (
            <IonSelect
              value={selectedPriority}
              onIonChange={(e) => setSelectedPriority(e.detail.value)}
              placeholder="Filter by Priority"
            >
              <IonSelectOption value="all">All Priorities</IonSelectOption>
              <IonSelectOption value="Low">Low</IonSelectOption>
              <IonSelectOption value="Medium">Medium</IonSelectOption>
              <IonSelectOption value="High">High</IonSelectOption>
              <IonSelectOption value="Critical">Critical</IonSelectOption>
            </IonSelect>
          )}

          {!isServiceEngineer && (
            <IonSelect
              value={selectedCategory}
              onIonChange={(e) => setSelectedCategory(e.detail.value)}
              placeholder="Filter by Category"
            >
              <IonSelectOption value="all">All Categories</IonSelectOption>
              <IonSelectOption value="Machine Failure">Machine Failure</IonSelectOption>
              <IonSelectOption value="Maintenance Request">Maintenance Request</IonSelectOption>
              <IonSelectOption value="Technical Support">Technical Support</IonSelectOption>
              <IonSelectOption value="Software Issue">Software Issue</IonSelectOption>
              <IonSelectOption value="Hardware Issue">Hardware Issue</IonSelectOption>
              <IonSelectOption value="Other">Other</IonSelectOption>
            </IonSelect>
          )}
        </div>

        {/* Tickets List - Role-Specific Display */}
        {tickets.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonText color="medium">
                <p style={{ textAlign: 'center' }}>
                  {isServiceEngineer
                    ? 'No tickets assigned to you'
                    : isEmployee
                    ? 'No tickets found'
                    : 'No tickets in the system'}
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          tickets.map((ticket) => (
            <IonCard key={ticket._id} className="ticket-card">
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>
                      {ticket.ticketNumber} - {ticket.title}
                    </h3>
                    <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                      {ticket.description.substring(0, 100)}...
                    </p>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <IonBadge color={getStatusColor(ticket.status)}>{ticket.status}</IonBadge>
                      <IonBadge color={getPriorityColor(ticket.priority)}>{ticket.priority}</IonBadge>
                      {!isServiceEngineer && (
                        <IonBadge color="secondary">{ticket.category}</IonBadge>
                      )}
                    </div>

                    {/* Show different info based on role */}
                    {isServiceEngineer && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Created by:</strong> {ticket.createdBy?.name}
                        </p>
                        {ticket.dueDate && (
                          <p style={{ margin: '0.25rem 0' }}>
                            <strong>Due:</strong>{' '}
                            {new Date(ticket.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {isEmployee && !isServiceEngineer && (
                      <>
                        {ticket.assignedTo && (
                          <p style={{ margin: '0.5rem 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                            Assigned to: <strong>{ticket.assignedTo.name}</strong>
                          </p>
                        )}
                        {!ticket.assignedTo && ticket.status === 'Open' && (
                          <p style={{ margin: '0.5rem 0 0 0', color: '#ff6b00', fontSize: '0.85rem' }}>
                            ⚠️ <strong>Awaiting Assignment</strong>
                          </p>
                        )}
                      </>
                    )}

                    {isHR && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                        Created by:{' '}
                        <strong>{ticket.createdBy?.name || 'Unknown'}</strong>
                        {ticket.assignedTo && (
                          <>
                            {' '} | Assigned to: <strong>{ticket.assignedTo.name}</strong>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <IonButton
                    color="primary"
                    onClick={() => history.push(`/service-ticket/${ticket._id}`)}
                    style={{ marginTop: 0 }}
                  >
                    <IonIcon slot="icon-only" icon={eye} />
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {/* FAB Button - Only for Employee and HR, not Service Engineers */}
        {!isServiceEngineer && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/create-service-ticket')}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default ServiceTicketManagement;
