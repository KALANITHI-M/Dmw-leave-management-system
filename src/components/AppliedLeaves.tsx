import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonChip,
} from '@ionic/react';
import { trashOutline, timeOutline, calendarOutline } from 'ionicons/icons';
import { Leave } from '../api/leaveService';
import './AppliedLeaves.css';

interface AppliedLeavesProps {
  leaves: Leave[];
  onDelete: (leaveId: string) => void;
}

const AppliedLeaves: React.FC<AppliedLeavesProps> = ({ leaves, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'medium';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="applied-leaves-container">
      <IonCard className="applied-leaves-card">
        <IonCardHeader className="applied-leaves-header">
          <IonCardTitle>APPLIED LEAVE(S)</IonCardTitle>
          <p className="leave-count">Total Applications: {leaves.length}</p>
        </IonCardHeader>
        <IonCardContent>
          {leaves.length === 0 ? (
            <div className="no-leaves">
              <p>No leave applications found</p>
              <p className="no-leaves-sub">Your leave applications will appear here</p>
            </div>
          ) : (
            <IonList className="leaves-list">
              {leaves.map((leave) => (
                <IonCard key={leave._id} className="leave-item-card">
                  <div className="leave-item-header">
                    <div className="leave-type-section">
                      <h3 className="leave-type">{leave.leaveType}</h3>
                      <IonBadge color={getStatusColor(leave.status)} className="status-badge">
                        {leave.status}
                      </IonBadge>
                    </div>
                    {leave.status === 'Pending' && (
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        onClick={() => onDelete(leave._id)}
                      >
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonButton>
                    )}
                  </div>

                  <div className="leave-item-body">
                    <div className="leave-info-row">
                      <IonIcon icon={calendarOutline} className="info-icon" />
                      <span className="info-label">Duration:</span>
                      <span className="info-value">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </span>
                      <IonChip className="days-chip" color="primary">
                        {leave.numberOfDays} {leave.numberOfDays === 1 ? 'Day' : 'Days'}
                      </IonChip>
                    </div>

                    <div className="leave-info-row">
                      <IonIcon icon={timeOutline} className="info-icon" />
                      <span className="info-label">Applied:</span>
                      <span className="info-value">
                        {formatDate(leave.createdAt)}
                      </span>
                    </div>

                    <div className="leave-reason">
                      <strong>Reason:</strong>
                      <p>{leave.reason}</p>
                    </div>

                    {leave.hrComments && (
                      <div className="hr-comments">
                        <strong>HR Comments:</strong>
                        <p>{leave.hrComments}</p>
                      </div>
                    )}

                    {leave.status === 'Approved' && leave.approvedBy && (
                      <div className="approval-info">
                        <span className="approval-text">
                          Approved by {leave.approvedBy.name} on {formatDate(leave.approvedDate!)}
                        </span>
                      </div>
                    )}

                    {leave.status === 'Rejected' && leave.approvedBy && (
                      <div className="rejection-info">
                        <span className="rejection-text">
                          Rejected by {leave.approvedBy.name} on {formatDate(leave.approvedDate!)}
                        </span>
                      </div>
                    )}
                  </div>
                </IonCard>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default AppliedLeaves;
