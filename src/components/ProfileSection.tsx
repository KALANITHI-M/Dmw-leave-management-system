import React, { useState, useEffect, useRef } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAvatar,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import './ProfileSection.css';

const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile photo from localStorage on mount
  useEffect(() => {
    if (user?._id) {
      const savedPhoto = localStorage.getItem(`profilePhoto_${user._id}`);
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    }
  }, [user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setToastMessage('Please select an image file');
        setShowToast(true);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage('Image size should be less than 5MB');
        setShowToast(true);
        return;
      }

      // Convert to base64 and store
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        if (user?._id) {
          localStorage.setItem(`profilePhoto_${user._id}`, base64String);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event('profilePhotoUpdated'));
          setToastMessage('Profile photo updated successfully');
          setShowToast(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-section">
      <IonCard className="profile-main-card">
        <IonCardHeader>
          <IonCardTitle>Profile Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4" className="profile-photo-col">
                <div className="profile-photo-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <IonAvatar className="profile-photo-large">
                    <img 
                      src={profilePhoto || "/avatar-placeholder.png"}
                      alt="Profile" 
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3880ff&color=fff&size=300`;
                      }} 
                    />
                  </IonAvatar>
                  <IonButton 
                    size="small" 
                    fill="outline" 
                    className="change-photo-btn"
                    onClick={handlePhotoClick}
                  >
                    Change Photo
                  </IonButton>
                </div>
              </IonCol>

              <IonCol size="12" sizeMd="8">
                <div className="profile-details">
                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Employee ID</IonLabel>
                    <IonInput
                      value={user?.employeeId}
                      readonly
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Full Name</IonLabel>
                    <IonInput
                      value={user?.name}
                      readonly={!isEditing}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Email Address</IonLabel>
                    <IonInput
                      value={user?.email}
                      readonly={!isEditing}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Department</IonLabel>
                    <IonInput
                      value={user?.department}
                      readonly={!isEditing}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Designation</IonLabel>
                    <IonInput
                      value={user?.designation}
                      readonly={!isEditing}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Phone Number</IonLabel>
                    <IonInput
                      value={user?.phoneNumber}
                      readonly={!isEditing}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Role</IonLabel>
                    <IonInput
                      value={user?.role === 'hr' ? 'HR Manager' : 'Employee'}
                      readonly
                      className="profile-input"
                    />
                  </IonItem>

                  <div className="profile-actions">
                    {!isEditing ? (
                      <IonButton onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </IonButton>
                    ) : (
                      <>
                        <IonButton color="success" onClick={() => setIsEditing(false)}>
                          Save Changes
                        </IonButton>
                        <IonButton color="medium" fill="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </IonButton>
                      </>
                    )}
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastMessage.includes('successfully') ? 'success' : 'danger'}
      />
    </div>
  );
};

export default ProfileSection;
