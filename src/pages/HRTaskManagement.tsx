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
} from '@ionic/react';
import { add, trash, pencil, analytics, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { taskService } from '../api/taskService';
import './HRTaskManagement.css';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  progress: number;
  dueDate: string;
  createdBy: { name: string };
  assignedTo: Array<{ name: string }>;
}

interface ReportData {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: { [key: string]: number };
}

const HRTaskManagement: React.FC = () => {
  const history = useHistory();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const [showReports, setShowReports] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({});
      setAllTasks(response.tasks);
      setTasks(response.tasks);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await taskService.getTaskReports();
      setReports(response.report);
      setShowReports(true);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load reports');
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (window.confirm(`Delete task "${taskTitle}"?`)) {
      try {
        await taskService.deleteTask(taskId);
        setTasks(tasks.filter((t) => t._id !== taskId));
        setAllTasks(allTasks.filter((t) => t._id !== taskId));
        showSuccessMessage('Task deleted successfully');
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const applyFilters = () => {
    let filtered = allTasks;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === selectedPriority);
    }

    if (searchText) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setTasks(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedStatus, selectedPriority, searchText, allTasks]);

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

  const completionRate = reports
    ? Math.round((reports.completed / reports.total) * 100)
    : 0;

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
            <IonTitle>Task Management</IonTitle>
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
          <IonTitle>Task Management</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/create-task" color="primary">
              <IonIcon slot="start" icon={add} />
              Create Task
            </IonButton>
            <IonButton onClick={fetchReports} className="report-btn">
              <IonIcon slot="icon-only" icon={analytics} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding task-management-content">
        {/* Reports Modal */}
        {showReports && reports && (
          <IonCard className="reports-card">
            <IonCardHeader>
              <div className="reports-header">
                <IonCardTitle>Task Reports</IonCardTitle>
                <IonButton
                  fill="clear"
                  onClick={() => setShowReports(false)}
                  className="close-btn"
                >
                  ✕
                </IonButton>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <div className="reports-grid">
                <div className="report-item total">
                  <div className="report-label">Total Tasks</div>
                  <div className="report-value">{reports.total}</div>
                </div>
                <div className="report-item completed">
                  <div className="report-label">Completed</div>
                  <div className="report-value">{reports.completed}</div>
                </div>
                <div className="report-item pending">
                  <div className="report-label">Pending</div>
                  <div className="report-value">{reports.pending}</div>
                </div>
                <div className="report-item overdue">
                  <div className="report-label">Overdue</div>
                  <div className="report-value">{reports.overdue}</div>
                </div>
              </div>

              <div className="completion-section">
                <div className="completion-label">Overall Completion</div>
                <div className="completion-bar">
                  <div
                    className="completion-fill"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <div className="completion-percentage">{completionRate}%</div>
              </div>

              <div className="priority-breakdown">
                <h3>By Priority</h3>
                {Object.entries(reports.byPriority).map(([priority, count]) => (
                  <div key={priority} className="priority-row">
                    <span>{priority}</span>
                    <IonBadge color={getPriorityColor(priority)}>{count}</IonBadge>
                  </div>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}

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

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonText color="medium">
                <p style={{ textAlign: 'center' }}>No tasks found</p>
              </IonText>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                <IonButton color="primary" routerLink="/create-task">
                  <IonIcon slot="start" icon={add} />
                  Create Task
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        ) : (
          tasks.map((task) => (
            <IonCard key={task._id} className="task-card">
              <IonCardContent>
                <div className="task-header">
                  <div>
                    <h2>{task.title}</h2>
                    <p className="task-description">{task.description}</p>
                  </div>
                  <div className="task-badges">
                    <IonBadge color={getStatusColor(task.status)}>{task.status}</IonBadge>
                    <IonBadge color={getPriorityColor(task.priority)}>{task.priority}</IonBadge>
                  </div>
                </div>

                <div className="task-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{task.progress}%</span>
                </div>

                <div className="task-meta">
                  <div className="meta-item">
                    <span className="meta-label">Assigned To:</span>
                    <span className="meta-value">
                      {task.assignedTo.map((emp) => emp.name).join(', ')}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created By:</span>
                    <span className="meta-value">{task.createdBy.name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Due Date:</span>
                    <span className="meta-value">{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="task-actions">
                  <IonButton
                    size="small"
                    color="primary"
                    fill="solid"
                    routerLink={`/task/${task._id}`}
                  >
                    View Details
                  </IonButton>
                  <IonButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={() => handleDeleteTask(task._id, task.title)}
                  >
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {/* FAB Button */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton routerLink="/create-task">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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

export default HRTaskManagement;
