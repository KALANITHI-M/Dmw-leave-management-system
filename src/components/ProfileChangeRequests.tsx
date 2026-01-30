import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonNote,
  IonToast,
  IonLoading,
  IonModal,
  IonTextarea,
  IonText,
  IonInput,
} from '@ionic/react';
import { profileChangeRequestService, ProfileChangeRequest } from '../api/profileChangeRequestService';
import './ProfileChangeRequests.css';

const ProfileChangeRequests: React.FC = () => {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);
  const [reviewComments, setReviewComments] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await profileChangeRequestService.getAllRequests();
      setRequests(data);
    } catch (error: any) {
      setToastMessage('Failed to load requests');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: ProfileChangeRequest) => {
    setSelectedRequest(request);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest?._id) return;

    setLoading(true);
    try {
      await profileChangeRequestService.approveRequest(selectedRequest._id, reviewComments);
      setToastMessage('Request approved successfully');
      setShowToast(true);
      setShowReviewModal(false);
      fetchRequests();
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to approve request');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest?._id) return;

    setLoading(true);
    try {
      await profileChangeRequestService.rejectRequest(selectedRequest._id, reviewComments);
      setToastMessage('Request rejected');
      setShowToast(true);
      setShowReviewModal(false);
      fetchRequests();
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to reject request');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getChangeSummary = (request: ProfileChangeRequest) => {
    const changes: string[] = [];
    const { requestedChanges, currentData } = request;

    if (requestedChanges.name && requestedChanges.name !== currentData.name) {
      changes.push(`Name: ${currentData.name} → ${requestedChanges.name}`);
    }
    if (requestedChanges.email && requestedChanges.email !== currentData.email) {
      changes.push(`Email: ${currentData.email} → ${requestedChanges.email}`);
    }
    if (requestedChanges.department && requestedChanges.department !== currentData.department) {
      changes.push(`Department: ${currentData.department} → ${requestedChanges.department}`);
    }
    if (requestedChanges.designation && requestedChanges.designation !== currentData.designation) {
      changes.push(`Designation: ${currentData.designation} → ${requestedChanges.designation}`);
    }
    if (requestedChanges.phoneNumber && requestedChanges.phoneNumber !== currentData.phoneNumber) {
      changes.push(`Phone: ${currentData.phoneNumber || 'N/A'} → ${requestedChanges.phoneNumber}`);
    }

    return changes;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="profile-change-requests">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            Profile Change Requests
            {pendingRequests.length > 0 && (
              <IonBadge color="warning" style={{ marginLeft: '10px' }}>
                {pendingRequests.length} Pending
              </IonBadge>
            )}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {pendingRequests.length === 0 && reviewedRequests.length === 0 ? (
            <IonNote>No profile change requests found</IonNote>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <>
                  <IonText color="primary">
                    <h3>Pending Requests</h3>
                  </IonText>
                  <IonList>
                    {pendingRequests.map((request) => (
                      <IonCard key={request._id} className="request-card">
                        <IonCardContent>
                          <IonGrid>
                            <IonRow>
                              <IonCol size="12" sizeMd="8">
                                <IonLabel>
                                  <h2>Employee ID: {request.employeeId}</h2>
                                  <p>
                                    <strong>Requested Changes:</strong>
                                  </p>
                                  {getChangeSummary(request).map((change, idx) => (
                                    <p key={idx} className="change-item">• {change}</p>
                                  ))}
                                  <IonNote>
                                    Requested: {new Date(request.createdAt!).toLocaleString()}
                                  </IonNote>
                                </IonLabel>
                              </IonCol>
                              <IonCol size="12" sizeMd="4" className="ion-text-center">
                                <IonBadge color={getStatusColor(request.status)}>
                                  {request.status.toUpperCase()}
                                </IonBadge>
                                <div style={{ marginTop: '10px' }}>
                                  <IonButton
                                    size="small"
                                    onClick={() => handleReview(request)}
                                  >
                                    Review
                                  </IonButton>
                                </div>
                              </IonCol>
                            </IonRow>
                          </IonGrid>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </IonList>
                </>
              )}

              {reviewedRequests.length > 0 && (
                <>
                  <IonText color="medium" style={{ marginTop: '20px' }}>
                    <h3>Review History</h3>
                  </IonText>
                  <IonList>
                    {reviewedRequests.map((request) => (
                      <IonCard key={request._id} className="request-card reviewed">
                        <IonCardContent>
                          <IonGrid>
                            <IonRow>
                              <IonCol size="12" sizeMd="10">
                                <IonLabel>
                                  <h2>Employee ID: {request.employeeId}</h2>
                                  <p>
                                    <strong>Changes:</strong>
                                  </p>
                                  {getChangeSummary(request).map((change, idx) => (
                                    <p key={idx} className="change-item">• {change}</p>
                                  ))}
                                  {request.comments && (
                                    <p>
                                      <strong>Comments:</strong> {request.comments}
                                    </p>
                                  )}
                                  <IonNote>
                                    Reviewed: {new Date(request.reviewedAt!).toLocaleString()}
                                  </IonNote>
                                </IonLabel>
                              </IonCol>
                              <IonCol size="12" sizeMd="2" className="ion-text-center">
                                <IonBadge color={getStatusColor(request.status)}>
                                  {request.status.toUpperCase()}
                                </IonBadge>
                              </IonCol>
                            </IonRow>
                          </IonGrid>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </IonList>
                </>
              )}
            </>
          )}
        </IonCardContent>
      </IonCard>

      {/* Review Modal */}
      <IonModal isOpen={showReviewModal} onDidDismiss={() => setShowReviewModal(false)}>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Review Profile Change Request</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {selectedRequest && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Employee ID</IonLabel>
                  <IonInput value={selectedRequest.employeeId} readonly />
                </IonItem>

                <div style={{ margin: '20px 0' }}>
                  <h3>Requested Changes:</h3>
                  {getChangeSummary(selectedRequest).map((change, idx) => (
                    <p key={idx} style={{ marginLeft: '10px' }}>• {change}</p>
                  ))}
                </div>

                <IonItem>
                  <IonLabel position="stacked">Comments (Optional)</IonLabel>
                  <IonTextarea
                    value={reviewComments}
                    onIonInput={(e) => setReviewComments(e.detail.value || '')}
                    placeholder="Add comments for the employee..."
                    rows={4}
                  />
                </IonItem>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <IonButton expand="block" color="success" onClick={handleApprove}>
                    Approve
                  </IonButton>
                  <IonButton expand="block" color="danger" onClick={handleReject}>
                    Reject
                  </IonButton>
                  <IonButton expand="block" fill="outline" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </IonButton>
                </div>
              </>
            )}
          </IonCardContent>
        </IonCard>
      </IonModal>

      <IonLoading isOpen={loading} message="Processing..." />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastMessage.includes('success') || toastMessage.includes('approved') ? 'success' : 'danger'}
      />
    </div>
  );
};

export default ProfileChangeRequests;
