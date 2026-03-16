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
  IonInput,
  IonTextarea,
  IonItem,
  IonBadge,
  IonText,
  IonSpinner,
  IonIcon,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonButtons,
} from '@ionic/react';
import { checkmark, send, trash, arrowBack } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { taskService } from '../api/taskService';
import { useAuth } from '../context/AuthContext';
import './TaskDetail.css';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  progress: number;
  dueDate: string;
  startDate: string;
  createdBy: { _id: string; name: string };
  assignedTo: Array<{ _id: string; name: string }>;
  completedDate?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; designation: string };
  createdAt: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');

  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTaskById(id);
      setTask(response.task);
      setNewProgress(response.task.progress);
      setNewStatus(response.task.status);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await taskService.getTaskComments(id);
      setComments(response.comments);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load comments');
    }
  };

  const handleUpdateProgress = async () => {
    try {
      setUpdating(true);
      const response = await taskService.updateTaskProgress(id, newProgress, newStatus);
      setTask(response.task);
      showSuccessMessage('Task updated successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showError('Comment cannot be empty');
      return;
    }

    try {
      setUpdating(true);
      const response = await taskService.addComment(id, newComment);
      setComments([response.comment, ...comments]);
      setNewComment('');
      showSuccessMessage('Comment added');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await taskService.deleteComment(id, commentId);
        setComments(comments.filter((c) => c._id !== commentId));
        showSuccessMessage('Comment deleted');
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to delete comment');
      }
    }
  };

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
            <IonTitle>Task Details</IonTitle>
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

  if (!task) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Task Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <p style={{ textAlign: 'center' }}>Task not found</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  const isAssigned = task.assignedTo.some((emp) => emp._id === user?._id);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Task Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding task-detail-content">
        {/* Task Header */}
        <IonCard className="task-detail-header">
          <IonCardHeader>
            <div className="detail-header-top">
              <IonCardTitle>{task.title}</IonCardTitle>
              <div className="detail-badges">
                <IonBadge color={getStatusColor(task.status)}>{task.status}</IonBadge>
                <IonBadge color={getPriorityColor(task.priority)}>{task.priority}</IonBadge>
              </div>
            </div>
          </IonCardHeader>

          <IonCardContent>
            <p className="task-description">{task.description}</p>

            <div className="task-info-grid">
              <div className="info-item">
                <span className="info-label">Assigned by</span>
                <span className="info-value">{task.createdBy.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Start Date</span>
                <span className="info-value">{new Date(task.startDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Due Date</span>
                <span className="info-value">{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
              {task.completedDate && (
                <div className="info-item">
                  <span className="info-label">Completed</span>
                  <span className="info-value">
                    {new Date(task.completedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Tabs */}
        <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as any)}>
          <IonSegmentButton value="details">
            <IonLabel>Details</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="comments">
            <IonLabel>Comments</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <>
            <IonCard className="ion-margin-top">
              <IonCardHeader>
                <IonCardTitle>Progress</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="progress-display">
                  <div className="progress-percentage">{newProgress}%</div>
                  <div className="progress-bar-large">
                    <div
                      className="progress-fill-large"
                      style={{ width: `${newProgress}%` }}
                    ></div>
                  </div>
                </div>

                {isAssigned && task.status !== 'Completed' && (
                  <div className="progress-control">
                    <IonItem>
                    <IonLabel>Update Progress: {newProgress}%</IonLabel>
                  </IonItem>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(parseInt(e.target.value, 10))}
                    disabled={updating}
                    style={{ width: '100%', margin: '1rem 0' }}
                  />
                    <IonItem>
                      <IonLabel>Status</IonLabel>
                      <IonInput
                        placeholder="Select Status"
                        value={newStatus}
                        onIonChange={(e) => setNewStatus(e.detail.value!)}
                        disabled={updating}
                      />
                    </IonItem>

                    <IonButton
                      expand="block"
                      onClick={handleUpdateProgress}
                      disabled={updating}
                      className="ion-margin-top"
                    >
                      {updating ? <IonSpinner name="dots" /> : 'Update Progress'}
                    </IonButton>
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {task.assignedTo.length > 0 && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Assigned To</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {task.assignedTo.map((emp) => (
                    <div key={emp._id} className="assigned-person">
                      <span>{emp.name}</span>
                    </div>
                  ))}
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <>
            {isAssigned && (
              <IonCard className="ion-margin-top">
                <IonCardHeader>
                  <IonCardTitle>Add Comment</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonTextarea
                      placeholder="Type your comment..."
                      value={newComment}
                      onIonChange={(e) => setNewComment(e.detail.value!)}
                      rows={3}
                      disabled={updating}
                    />
                  </IonItem>
                  <IonButton
                    expand="block"
                    onClick={handleAddComment}
                    disabled={updating}
                    className="ion-margin-top"
                  >
                    <IonIcon slot="start" icon={send} />
                    {updating ? 'Posting...' : 'Post Comment'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}

            <div className="comments-section">
              {comments.length === 0 ? (
                <IonCard>
                  <IonCardContent>
                    <IonText color="medium">
                      <p style={{ textAlign: 'center' }}>No comments yet</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              ) : (
                comments.map((comment) => (
                  <IonCard key={comment._id} className="comment-card">
                    <IonCardContent>
                      <div className="comment-header">
                        <div>
                          <strong>{comment.author.name}</strong>
                          <span className="comment-designation">{comment.author.designation}</span>
                        </div>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                      {(comment.author._id === user?._id || user?.role === 'hr') && (
                        <IonButton
                          size="small"
                          fill="clear"
                          color="danger"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonButton>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>
          </>
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

export default TaskDetail;
