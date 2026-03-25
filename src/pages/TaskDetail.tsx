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
  approvalStatus?: string;
  submissionDate?: string;
  approvedBy?: { _id: string; name: string };
  approvalDate?: string;
  approvalNotes?: string;
  completionProofUrl?: string;
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Determine the dashboard route based on user role
  const dashboardRoute = user?.role === 'hr' ? '/hr/dashboard' : '/employee/dashboard';

  // Handle back navigation reliably
  const handleBackClick = () => {
    // Use replace to replace the current route in history stack, ensuring proper navigation
    history.replace(dashboardRoute);
  };

  useEffect(() => {
    // Reset state when ID changes
    setTask(null);
    setComments([]);
    setActiveTab('details');
    setNewComment('');
    setNewProgress(0);
    setNewStatus('');
    setProofFile(null);
    setApprovalNotes('');
    
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
      const response = await taskService.updateTaskProgress(id, newProgress);
      setTask(response.task);
      showSuccessMessage('Task progress updated successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile) {
      showError('Please select a photo or screenshot');
      return;
    }

    try {
      setUpdating(true);
      const response = await taskService.uploadCompletionProof(id, proofFile);
      setTask(response.task);
      setProofFile(null);
      showSuccessMessage('Proof uploaded successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!task?.completionProofUrl) {
      showError('Please upload a proof photo/screenshot before submitting');
      return;
    }

    if (window.confirm('Submit this task for HR approval?')) {
      try {
        setUpdating(true);
        const response = await taskService.submitTaskForApproval(id);
        setTask(response.task);
        showSuccessMessage('Task submitted for HR approval');
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to submit task');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleApproveTask = async () => {
    if (!approvalNotes.trim()) {
      showError('Please add approval notes');
      return;
    }

    if (window.confirm('Approve this task completion?')) {
      try {
        setUpdating(true);
        const response = await taskService.approveTaskCompletion(id, approvalNotes);
        setTask(response.task);
        showSuccessMessage('Task approved successfully');
        setApprovalNotes('');
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to approve task');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleRejectTask = async () => {
    if (!approvalNotes.trim()) {
      showError('Please add rejection reason');
      return;
    }

    if (window.confirm('Reject this task? The employee will need to resubmit.')) {
      try {
        setUpdating(true);
        const response = await taskService.rejectTaskCompletion(id, approvalNotes);
        setTask(response.task);
        showSuccessMessage('Task rejected with feedback');
        setApprovalNotes('');
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to reject task');
      } finally {
        setUpdating(false);
      }
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

  const getApprovalStatusColor = (approvalStatus: string | undefined) => {
    switch (approvalStatus) {
      case 'Approved':
        return 'success';
      case 'Pending Approval':
        return 'warning';
      case 'Rejected':
        return 'danger';
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
              <IonButton onClick={handleBackClick}>
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
              <IonButton onClick={handleBackClick}>
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
            <IonButton onClick={handleBackClick}>
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

            {/* Approval Status Section */}
            {task.status === 'Completed' && (
              <div className="approval-status-section" style={{ marginTop: '1rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Approval Status:</strong>
                <IonBadge color={getApprovalStatusColor(task.approvalStatus)}>
                  {task.approvalStatus || 'Not Submitted'}
                </IonBadge>
                {task.submissionDate && (
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
                    Submitted: {new Date(task.submissionDate).toLocaleDateString()}
                  </p>
                )}
                {task.approvalDate && (
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
                    Reviewed: {new Date(task.approvalDate).toLocaleDateString()} by {task.approvedBy?.name}
                  </p>
                )}
                {task.approvalNotes && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <small><strong>Feedback:</strong> {task.approvalNotes}</small>
                  </div>
                )}
              </div>
            )}

            {/* Employee Proof Section - Visible to HR for completed tasks */}
            {user?.role === 'hr' && task.status === 'Completed' && task.completionProofUrl && (
              <div className="employee-proof-section">
                <strong className="proof-title">📸 Employee Completion Proof</strong>
                <div className="proof-image-container">
                  <img 
                    src={task.completionProofUrl} 
                    alt="Task Completion Proof" 
                    className="proof-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {task.submissionDate && (
                  <p className="proof-submission-date">
                    Submitted on: {new Date(task.submissionDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
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

                {/* Work Evidence Section - Always available for assigned employees */}
                {isAssigned && task.status !== 'Completed' && (
                  <IonCard className="ion-margin-top work-evidence-card">
                    <IonCardHeader>
                      <IonCardTitle>� Upload Work Proof</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonText color="medium">
                        <small style={{ display: 'block', marginBottom: '1rem' }}>
                          📷 Upload photos or screenshots as proof of your work (JPG, PNG only - Max 5MB)
                        </small>
                      </IonText>

                      {/* Display current proof if exists */}
                      {task.completionProofUrl && (
                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
                          <strong style={{ color: '#0066cc' }}>✓ Proof Uploaded:</strong>
                          <img 
                            src={task.completionProofUrl} 
                            alt="Proof" 
                            style={{ marginTop: '0.5rem', maxWidth: '100%', maxHeight: '150px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      {/* File Input */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
                          Select Image File
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                showError('File size must be less than 5MB');
                              } else if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                                showError('Only JPG and PNG images are allowed');
                              } else {
                                setProofFile(file);
                              }
                            }
                          }}
                          disabled={updating}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px dashed #2196F3',
                            borderRadius: '6px',
                            backgroundColor: '#f5f5f5',
                            cursor: updating ? 'not-allowed' : 'pointer',
                          }}
                        />
                        {proofFile && (
                          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                            📁 Selected: {proofFile.name}
                          </p>
                        )}
                      </div>

                      <IonButton
                        expand="block"
                        fill="solid"
                        color="primary"
                        onClick={handleUploadProof}
                        disabled={updating || !proofFile}
                        className="ion-margin-top"
                      >
                        {updating ? <IonSpinner name="dots" /> : '⬆️ Upload Proof'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                )}

                {/* Submit for Approval - Show when 100% complete */}
                {isAssigned && newProgress === 100 && task.approvalStatus !== 'Pending Approval' && task.approvalStatus !== 'Approved' && (
                  <IonCard className="ion-margin-top submit-approval-card">
                    <IonCardHeader>
                      <IonCardTitle>✅ Ready to Submit</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonText color="success">
                        <p><strong>Task is 100% complete!</strong> Submit your proof for HR approval?</p>
                      </IonText>
                      {!task.completionProofUrl && (
                        <IonText color="warning">
                          <small style={{ display: 'block', marginTop: '0.5rem' }}>
                            ⚠️ Please upload a proof photo above before submitting
                          </small>
                        </IonText>
                      )}
                      <IonButton
                        expand="block"
                        color="success"
                        onClick={handleSubmitForApproval}
                        disabled={updating || !task.completionProofUrl}
                        className="ion-margin-top"
                      >
                        {updating ? <IonSpinner name="dots" /> : '🚀 Submit for HR Approval'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
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

            {/* HR Approval Section */}
            {user?.role === 'hr' && task.approvalStatus === 'Pending Approval' && (
              <IonCard className="approval-card">
                <IonCardHeader>
                  <IonCardTitle>Review Task Completion</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="completion-proof-display">
                    <strong>📸 Employee Submitted Proof:</strong>
                    {task.completionProofUrl ? (
                      <img 
                        src={task.completionProofUrl} 
                        alt="Task Proof" 
                        style={{ 
                          marginTop: '1rem', 
                          maxWidth: '100%', 
                          maxHeight: '300px', 
                          borderRadius: '8px', 
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <p style={{ marginTop: '0.5rem', color: '#999' }}>No proof submitted</p>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <IonItem>
                      <IonLabel position="stacked">Approval Notes/Feedback</IonLabel>
                      <IonTextarea
                        placeholder="Add your approval notes or rejection reason"
                        value={approvalNotes}
                        onIonChange={(e) => setApprovalNotes(e.detail.value!)}
                        rows={3}
                        disabled={updating}
                      />
                    </IonItem>
                  </div>

                  <div className="approval-buttons">
                    <IonButton
                      expand="block"
                      color="success"
                      onClick={handleApproveTask}
                      disabled={updating || !approvalNotes.trim()}
                    >
                      ✓ Approve Task
                    </IonButton>
                    <IonButton
                      expand="block"
                      color="danger"
                      onClick={handleRejectTask}
                      disabled={updating || !approvalNotes.trim()}
                    >
                      ✗ Reject & Send Back
                    </IonButton>
                  </div>
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
