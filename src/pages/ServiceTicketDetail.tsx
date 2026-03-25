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
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { arrowBack, download, trash, send, cloudUpload, close } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { serviceTicketService } from '../api/serviceTicketService';
import { useAuth } from '../context/AuthContext';
import './ServiceTicketDetail.css';

interface ServiceTicket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  createdBy: { _id: string; name: string; email: string };
  assignedTo?: { _id: string; name: string; email: string };
  closedBy?: { _id: string; name: string };
  attachments: any[];
  proofOfWork: any[];
  resolutionNotes?: string;
  closureNotes?: string;
  createdAt: string;
  dueDate?: string;
  resolvedDate?: string;
  closedDate?: string;
}

interface Comment {
  _id: string;
  content: string;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  isInternal: boolean;
}

interface Activity {
  _id: string;
  action: string;
  actionDetails: string;
  performedBy: { name: string; email: string };
  createdAt: string;
}

const ServiceTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');

  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedEngineer, setAssignedEngineer] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await serviceTicketService.getTicketById(id);
      setTicket(response.ticket);
      setComments(response.comments);
      setActivities(response.activities);
      setNewStatus(response.ticket.status);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
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
    const colors: { [key: string]: string } = {
      'Open': 'medium',
      'Assigned': 'primary',
      'In Progress': 'warning',
      'Resolved': 'success',
      'Closed': 'dark',
      'On Hold': 'secondary',
    };
    return colors[status] || 'medium';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'Critical': 'danger',
      'High': 'warning',
      'Medium': 'primary',
      'Low': 'medium',
    };
    return colors[priority] || 'medium';
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showError('Comment cannot be empty');
      return;
    }

    try {
      setUpdating(true);
      const response = await serviceTicketService.addComment(id, newComment, isInternalComment);
      setComments([response.comment, ...comments]);
      setNewComment('');
      setIsInternalComment(false);
      showSuccessMessage('Comment added successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === ticket?.status) {
      showError('Please select a different status');
      return;
    }

    try {
      setUpdating(true);
      const response = await serviceTicketService.updateTicketStatus(id, newStatus, resolutionNotes);
      setTicket(response.ticket);
      setResolutionNotes('');
      showSuccessMessage(`Ticket status updated to ${newStatus}`);
      fetchTicket();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadProof = async () => {
    if (proofFiles.length === 0) {
      showError('Please select at least one file');
      return;
    }

    try {
      setUpdating(true);
      const formData = new FormData();
      proofFiles.forEach((file) => {
        formData.append('proofFiles', file);
      });
      if (resolutionNotes) {
        formData.append('description', resolutionNotes);
      }

      const response = await serviceTicketService.uploadProofOfWork(id, formData);
      setTicket(response.ticket);
      setProofFiles([]);
      setResolutionNotes('');
      showSuccessMessage('Proof uploaded successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUpdating(false);
    }
  };

  const canAssignTicket = user && user.role === 'hr';
  const canUpdateStatus = (ticket?.assignedTo?._id === user?._id) || (user && user.role === 'hr');
  const canUploadProof = ticket?.assignedTo?._id === user?._id;
  const canClose = user && user.role === 'hr';

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
            <IonTitle>Service Ticket</IonTitle>
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

  if (!ticket) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Service Ticket</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <p style={{ textAlign: 'center' }}>Ticket not found</p>
          </IonText>
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
          <IonTitle>{ticket.ticketNumber}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding service-ticket-detail-content">
        {/* Header Card */}
        <IonCard className="ticket-detail-header">
          <IonCardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <IonCardTitle>{ticket.title}</IonCardTitle>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  {ticket.description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <IonBadge color={getStatusColor(ticket.status)}>{ticket.status}</IonBadge>
                <IonBadge color={getPriorityColor(ticket.priority)}>{ticket.priority}</IonBadge>
              </div>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <div className="ticket-info-grid">
              <div className="info-item">
                <span className="info-label">Ticket #</span>
                <span className="info-value">{ticket.ticketNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Category</span>
                <span className="info-value">{ticket.category}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created By</span>
                <span className="info-value">{ticket.createdBy.name}</span>
              </div>
              {ticket.assignedTo && (
                <div className="info-item">
                  <span className="info-label">Assigned To</span>
                  <span className="info-value">{ticket.assignedTo.name}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Created</span>
                <span className="info-value">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              {ticket.dueDate && (
                <div className="info-item">
                  <span className="info-label">Due Date</span>
                  <span className="info-value">{new Date(ticket.dueDate).toLocaleDateString()}</span>
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
            <IonLabel>Comments ({comments.length})</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="activity">
            <IonLabel>Activity</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <>
            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <IonCard className="ion-margin-top">
                <IonCardHeader>
                  <IonCardTitle>Attachments</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {ticket.attachments.map((att, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                      <span>{att.filename}</span>
                      <IonButton fill="clear" size="small" href={att.url} target="_blank">
                        <IonIcon slot="icon-only" icon={download} />
                      </IonButton>
                    </div>
                  ))}
                </IonCardContent>
              </IonCard>
            )}

            {/* Proof of Work */}
            {ticket.proofOfWork.length > 0 && (
              <IonCard className="ion-margin-top">
                <IonCardHeader>
                  <IonCardTitle>📸 Proof of Work</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {ticket.proofOfWork.map((proof, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{proof.filename}</strong>
                        <IonButton fill="clear" size="small" href={proof.url} target="_blank">
                          <IonIcon slot="icon-only" icon={download} />
                        </IonButton>
                      </div>
                      {proof.description && (
                        <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>{proof.description}</p>
                      )}
                      <small style={{ color: '#999' }}>Uploaded: {new Date(proof.uploadedAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </IonCardContent>
              </IonCard>
            )}

            {/* Status Update Section */}
            {canUpdateStatus && (
              <IonCard className="ion-margin-top">
                <IonCardHeader>
                  <IonCardTitle>Update Status</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">New Status</IonLabel>
                    <IonSelect value={newStatus} onIonChange={(e) => setNewStatus(e.detail.value)} disabled={updating}>
                      <IonSelectOption value="Open">Open</IonSelectOption>
                      <IonSelectOption value="Assigned">Assigned</IonSelectOption>
                      <IonSelectOption value="In Progress">In Progress</IonSelectOption>
                      <IonSelectOption value="Resolved">Resolved</IonSelectOption>
                      {canClose && <IonSelectOption value="Closed">Closed</IonSelectOption>}
                      <IonSelectOption value="On Hold">On Hold</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  {newStatus === 'Resolved' && (
                    <IonItem style={{ marginTop: '1rem' }}>
                      <IonLabel position="stacked">Resolution Notes (Optional)</IonLabel>
                      <IonTextarea
                        placeholder="Add resolution notes"
                        value={resolutionNotes}
                        onIonChange={(e) => setResolutionNotes(e.detail.value || '')}
                        rows={3}
                        disabled={updating}
                      />
                    </IonItem>
                  )}

                  <IonButton expand="block" onClick={handleUpdateStatus} disabled={updating || newStatus === ticket.status} style={{ marginTop: '1rem' }}>
                    {updating ? <IonSpinner name="dots" /> : 'Update Status'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}

            {/* Upload Proof */}
            {canUploadProof && ticket.status !== 'Closed' && (
              <IonCard className="ion-margin-top">
                <IonCardHeader>
                  <IonCardTitle>Upload Proof of Work</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText color="medium">
                    <small>Upload images or documents as proof of work (Max 10MB each)</small>
                  </IonText>

                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        padding: '2rem',
                        border: '2px dashed #667eea',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#f8f9ff',
                      }}
                    >
                      <IonIcon icon={cloudUpload} style={{ fontSize: '2rem', color: '#667eea' }} />
                      <p style={{ margin: '0.5rem 0 0 0', color: '#667eea', fontWeight: '600' }}>
                        Click to choose files
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setProofFiles(Array.from(e.target.files || []))}
                        disabled={updating}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {proofFiles.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontWeight: '600' }}>Selected: {proofFiles.length} file(s)</p>
                    </div>
                  )}

                  <IonItem>
                    <IonLabel position="stacked">Description (Optional)</IonLabel>
                    <IonTextarea
                      placeholder="Describe the proof"
                      value={resolutionNotes}
                      onIonChange={(e) => setResolutionNotes(e.detail.value || '')}
                      rows={3}
                      disabled={updating}
                    />
                  </IonItem>

                  <IonButton expand="block" onClick={handleUploadProof} disabled={updating || proofFiles.length === 0} style={{ marginTop: '1rem' }}>
                    {updating ? <IonSpinner name="dots" /> : 'Upload Proof'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <>
            <IonCard className="ion-margin-top">
              <IonCardHeader>
                <IonCardTitle>Add Comment</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel position="stacked">Your Comment</IonLabel>
                  <IonTextarea
                    placeholder="Type your comment..."
                    value={newComment}
                    onIonChange={(e) => setNewComment(e.detail.value || '')}
                    rows={3}
                    disabled={updating}
                  />
                </IonItem>

                {user?.role === 'hr' && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      disabled={updating}
                    />
                    <label htmlFor="internal" style={{ marginLeft: '0.5rem', cursor: 'pointer' }}>
                      Internal Comment (Only visible to HR)
                    </label>
                  </div>
                )}

                <IonButton expand="block" onClick={handleAddComment} disabled={updating || !newComment.trim()} style={{ marginTop: '1rem' }}>
                  <IonIcon slot="start" icon={send} />
                  {updating ? 'Posting...' : 'Post Comment'}
                </IonButton>
              </IonCardContent>
            </IonCard>

            {/* Comments List */}
            <div style={{ marginTop: '1.5rem' }}>
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
                  <IonCard key={comment._id} style={{ marginBottom: '1rem' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <strong>{comment.createdBy.name}</strong>
                          {comment.isInternal && <IonBadge color="warning" style={{ marginLeft: '0.5rem' }}>Internal</IonBadge>}
                        </div>
                        <small style={{ color: '#999' }}>{new Date(comment.createdAt).toLocaleDateString()}</small>
                      </div>
                      <p style={{ margin: '0.5rem 0', color: '#555' }}>{comment.content}</p>
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>
          </>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div style={{ marginTop: '1.5rem' }}>
            {activities.length === 0 ? (
              <IonCard>
                <IonCardContent>
                  <IonText color="medium">
                    <p style={{ textAlign: 'center' }}>No activities yet</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            ) : (
              activities.map((activity) => (
                <IonCard key={activity._id} style={{ marginBottom: '1rem' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ textTransform: 'capitalize' }}>{activity.action.replace(/_/g, ' ')}</strong>
                        <p style={{ margin: '0.25rem 0', color: '#555', fontSize: '0.9rem' }}>{activity.actionDetails}</p>
                        <small style={{ color: '#999' }}>By {activity.performedBy.name}</small>
                      </div>
                      <small style={{ color: '#999', textAlign: 'right' }}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                        <br />
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </small>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>
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

export default ServiceTicketDetail;
