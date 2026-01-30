import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  IonModal,
  IonLoading,
} from '@ionic/react';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../api/employeeService';
import { profileChangeRequestService } from '../api/profileChangeRequestService';
import './ProfileSection.css';

const ProfileSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Editable profile fields
  const [editedData, setEditedData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    phoneNumber: '',
  });

  // Load profile photo and initialize editable data from user
  useEffect(() => {
    if (user?._id) {
      const savedPhoto = localStorage.getItem(`profilePhoto_${user._id}`);
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
      // Initialize editable data
      setEditedData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        designation: user.designation || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      }, 'image/jpeg');
    });
  };

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

      // Convert to base64 and show crop modal
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageToCrop(base64String);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropSave = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setProfilePhoto(croppedImage);
        if (user?._id) {
          localStorage.setItem(`profilePhoto_${user._id}`, croppedImage);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event('profilePhotoUpdated'));
          setToastMessage('Profile photo updated successfully');
          setShowToast(true);
        }
        setShowCropModal(false);
        setImageToCrop('');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    } catch (error) {
      setToastMessage('Failed to crop image');
      setShowToast(true);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSaveChanges = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      if (user.role === 'hr') {
        // HR can directly update their profile
        const updatedEmployee = await employeeService.updateEmployee(user._id, editedData);
        // Merge the updated employee data with the existing user token
        const updatedUser = {
          ...updatedEmployee,
          token: user.token, // Preserve the authentication token
        };
        updateUser(updatedUser);
        setIsEditing(false);
        setToastMessage('Profile updated successfully');
        setShowToast(true);
      } else {
        // Employee creates a change request
        await profileChangeRequestService.createRequest({
          employeeId: user._id,
          requestedBy: user._id,
          requestedChanges: editedData,
          currentData: {
            name: user.name,
            email: user.email,
            department: user.department,
            designation: user.designation,
            phoneNumber: user.phoneNumber || '',
          },
        });
        setIsEditing(false);
        setToastMessage('Profile change request submitted to HR for approval');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to process request');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original user data
    if (user) {
      setEditedData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        designation: user.designation || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
    setIsEditing(false);
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
                      value={editedData.name}
                      readonly={!isEditing}
                      onIonInput={(e) => setEditedData({ ...editedData, name: e.detail.value || '' })}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Email Address</IonLabel>
                    <IonInput
                      value={editedData.email}
                      readonly={!isEditing}
                      onIonInput={(e) => setEditedData({ ...editedData, email: e.detail.value || '' })}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Department</IonLabel>
                    <IonInput
                      value={editedData.department}
                      readonly={!isEditing}
                      onIonInput={(e) => setEditedData({ ...editedData, department: e.detail.value || '' })}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Designation</IonLabel>
                    <IonInput
                      value={editedData.designation}
                      readonly={!isEditing}
                      onIonInput={(e) => setEditedData({ ...editedData, designation: e.detail.value || '' })}
                      className="profile-input"
                    />
                  </IonItem>

                  <IonItem lines="none" className="profile-detail-item">
                    <IonLabel position="stacked" className="profile-label">Phone Number</IonLabel>
                    <IonInput
                      value={editedData.phoneNumber}
                      readonly={!isEditing}
                      onIonInput={(e) => setEditedData({ ...editedData, phoneNumber: e.detail.value || '' })}
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
                      <IonButton onClick={() => setIsEditing(true)} disabled={loading}>
                        Edit Profile
                      </IonButton>
                    ) : (
                      <>
                        <IonButton color="success" onClick={handleSaveChanges} disabled={loading}>
                          {user?.role === 'hr' ? 'Save Changes' : 'Request Changes'}
                        </IonButton>
                        <IonButton color="medium" fill="outline" onClick={handleCancelEdit} disabled={loading}>
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

      {/* Image Crop Modal */}
      <IonModal isOpen={showCropModal} onDidDismiss={handleCropCancel}>
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          background: '#000'
        }}>
          <div style={{ 
            padding: '16px', 
            background: '#1a1a1a',
            borderBottom: '1px solid #333'
          }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Crop Profile Photo</h2>
          </div>
          
          <div style={{ 
            position: 'relative', 
            flex: 1, 
            backgroundColor: '#000' 
          }}>
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div style={{ 
            padding: '16px', 
            background: '#1a1a1a',
            borderTop: '1px solid #333'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                color: '#fff', 
                fontSize: '14px', 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                Zoom
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <IonButton 
                expand="block" 
                onClick={handleCropSave}
                style={{ flex: 1 }}
              >
                Save
              </IonButton>
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={handleCropCancel}
                style={{ flex: 1 }}
              >
                Cancel
              </IonButton>
            </div>
          </div>
        </div>
      </IonModal>

      <IonLoading isOpen={loading} message="Updating profile..." />

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
