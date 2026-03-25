import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonText,
  IonSpinner,
  IonIcon,
  IonToast,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFab,
  IonFabButton,
} from '@ionic/react';
import { checkmark, close, alert, timerOutline, add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { taskService } from '../api/taskService';
import { useAuth } from '../context/AuthContext';
import './MyTasks.css';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  progress: number;
  dueDate: string;
  createdBy: { name: string };
}

interface MyTasksProps {
  embedded?: boolean;
}

const MyTasks: React.FC<MyTasksProps> = ({ embedded = false }) => {
  const { user } = useAuth();
  const history = useHistory();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  useEffect(() => {
    fetchMyTasks();
  }, [selectedStatus, selectedPriority]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (selectedPriority !== 'all') filters.priority = selectedPriority;

      const response = await taskService.getMyTasks(filters);
      setTasks(response.tasks);
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to load tasks');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Overdue':
        return 'danger';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return checkmark;
      case 'Overdue':
        return alert;
      case 'In Progress':
        return timerOutline;
      default:
        return close;
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    if (selectedTaskId && selectedTaskId !== 'all') {
      const existsInCurrentList = filteredTasks.some((task) => task._id === selectedTaskId);
      if (!existsInCurrentList) {
        setSelectedTaskId('');
      }
    }
  }, [filteredTasks, selectedTaskId]);

  const tasksToDisplay =
    selectedTaskId === 'all'
      ? filteredTasks
      : filteredTasks.filter((task) => task._id === selectedTaskId);

  const daysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = due.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  const statsData = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'Pending').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    overdue: tasks.filter((t) => t.status === 'Overdue').length,
  };

  const tasksContent = (
    <>
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{statsData.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{statsData.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-number">{statsData.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">{statsData.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-number">{statsData.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        {/* Search and Filters */}
        <IonSearchbar
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value || '')}
          placeholder="Search tasks..."
          className="ion-margin-bottom"
          autocapitalize="off"
        />

        <div className="filter-row">
          <IonSelect
            value={selectedStatus}
            onIonChange={(e) => setSelectedStatus(e.detail.value)}
            placeholder="Filter by Status"
          >
            <IonSelectOption value="all">All Status</IonSelectOption>
            <IonSelectOption value="Pending">Pending</IonSelectOption>
            <IonSelectOption value="In Progress">In Progress</IonSelectOption>
            <IonSelectOption value="Completed">Completed</IonSelectOption>
            <IonSelectOption value="Overdue">Overdue</IonSelectOption>
          </IonSelect>

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
        </div>

        {/* Task Selector */}
        {!loading && filteredTasks.length > 0 && (
          <IonSelect
            value={selectedTaskId}
            onIonChange={(e) => setSelectedTaskId(e.detail.value)}
            placeholder="Select task to view"
            className="task-select-dropdown"
          >
            <IonSelectOption value="all">All Tasks</IonSelectOption>
            {filteredTasks.map((task) => (
              <IonSelectOption key={task._id} value={task._id}>
                {task.title}
              </IonSelectOption>
            ))}
          </IonSelect>
        )}

        {/* Tasks List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonText color="medium">
                <p style={{ textAlign: 'center', marginTop: '20px' }}>No tasks found</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : selectedTaskId === '' ? (
          <IonCard>
            <IonCardContent>
              <IonText color="medium">
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                  Select a task from the dropdown to view details
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          tasksToDisplay.map((task) => (
            <IonCard key={task._id} className="task-card">
              <IonCardHeader>
                <div className="task-header">
                  <IonCardTitle>{task.title}</IonCardTitle>
                  <div className="task-badges">
                    <IonBadge color={getStatusColor(task.status)}>
                      <IonIcon icon={getStatusIcon(task.status)} /> {task.status}
                    </IonBadge>
                    <IonBadge color={getPriorityColor(task.priority)}>{task.priority}</IonBadge>
                  </div>
                </div>
              </IonCardHeader>

              <IonCardContent>
                <p className="task-description">{task.description}</p>

                <div className="task-progress">
                  <label>Progress: {task.progress}%</label>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${task.progress}%` }}></div>
                  </div>
                </div>

                <div className="task-meta">
                  <div className="meta-item">
                    <span className="meta-label">Assigned by:</span>
                    <span className="meta-value">{task.createdBy.name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Due Date:</span>
                    <span className="meta-value">
                      {new Date(task.dueDate).toLocaleDateString()}
                      {task.status !== 'Completed' && (
                        <span className="due-days">
                          {daysUntilDue(task.dueDate) <= 0
                            ? ' - Overdue!'
                            : ` (${daysUntilDue(task.dueDate)} days left)`}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() => history.push(`/task/${task._id}`)}
                  expand="block"
                  className="ion-margin-top"
                >
                  View Details
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {user?.role === 'hr' && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton routerLink="/create-task">
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
    </>
  );

  if (embedded) {
    return <div className="ion-padding my-tasks-embedded">{tasksContent}</div>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ paddingBottom: '120px' }}>
          {tasksContent}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyTasks;
