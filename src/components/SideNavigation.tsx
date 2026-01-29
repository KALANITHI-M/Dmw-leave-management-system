import React, { useState, useEffect } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuToggle,
  IonAvatar,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import {
  personOutline,
  documentTextOutline,
  statsChartOutline,
  logOutOutline,
  addCircleOutline,
  listOutline,
  peopleOutline,
} from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import './SideNavigation.css';

interface SideNavigationProps {
  contentId: string;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SideNavigation: React.FC<SideNavigationProps> = ({ contentId, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [profilePhoto, setProfilePhoto] = useState<string>('');

  // Load profile photo from localStorage and listen for changes
  useEffect(() => {
    const loadProfilePhoto = () => {
      if (user?._id) {
        const savedPhoto = localStorage.getItem(`profilePhoto_${user._id}`);
        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
        }
      }
    };

    loadProfilePhoto();

    // Listen for storage changes to update photo in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `profilePhoto_${user?._id}`) {
        setProfilePhoto(e.newValue || '');
      }
    };

    // Listen for custom event when photo is updated in the same tab
    const handlePhotoUpdate = () => {
      loadProfilePhoto();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const handleMenuItemClick = (section: string) => {
    onSectionChange(section);
  };

  return (
    <IonMenu contentId={contentId} type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>DMW CNC Solutions</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="side-nav-content">
        {/* Profile Section */}
        <IonCard className="profile-card">
          <IonCardContent className="profile-content">
            <IonAvatar className="profile-avatar">
              <img 
                src={profilePhoto || "/avatar-placeholder.png"} 
                alt="Profile" 
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3880ff&color=fff&size=200`;
                }} 
              />
            </IonAvatar>
            <h3 className="profile-name">{user?.name}</h3>
            <p className="profile-id">ID: {user?.employeeId}</p>
            <p className="profile-role">{user?.role === 'hr' ? 'HR Manager' : 'Employee'}</p>
          </IonCardContent>
        </IonCard>

        {/* Navigation Menu */}
        <IonList className="nav-list">
          <IonMenuToggle autoHide={false}>
            <IonItem
              button
              className={activeSection === 'profile' ? 'nav-item active' : 'nav-item'}
              onClick={() => handleMenuItemClick('profile')}
            >
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>Profile Settings</IonLabel>
            </IonItem>
          </IonMenuToggle>

          {/* Employee Navigation */}
          {user?.role === 'employee' && (
            <>
              <IonItem className="nav-section-header">
                <IonLabel>Leave Management</IonLabel>
              </IonItem>
              
              <IonMenuToggle autoHide={false}>
                <IonItem
                  button
                  className={activeSection === 'apply-leave' ? 'nav-item active sub-item' : 'nav-item sub-item'}
                  onClick={() => handleMenuItemClick('apply-leave')}
                >
                  <IonIcon icon={addCircleOutline} slot="start" />
                  <IonLabel>Apply For Leave</IonLabel>
                </IonItem>
              </IonMenuToggle>

              <IonMenuToggle autoHide={false}>
                <IonItem
                  button
                  className={activeSection === 'applied-leaves' ? 'nav-item active sub-item' : 'nav-item sub-item'}
                  onClick={() => handleMenuItemClick('applied-leaves')}
                >
                  <IonIcon icon={listOutline} slot="start" />
                  <IonLabel>Applied Leave(s)</IonLabel>
                </IonItem>
              </IonMenuToggle>

              <IonMenuToggle autoHide={false}>
                <IonItem
                  button
                  className={activeSection === 'dashboard' ? 'nav-item active' : 'nav-item'}
                  onClick={() => handleMenuItemClick('dashboard')}
                >
                  <IonIcon icon={statsChartOutline} slot="start" />
                  <IonLabel>Dashboard</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </>
          )}

          {/* HR Navigation */}
          {user?.role === 'hr' && (
            <>
              <IonItem className="nav-section-header">
                <IonLabel>Management</IonLabel>
              </IonItem>

              <IonMenuToggle autoHide={false}>
                <IonItem
                  button
                  className={activeSection === 'overview' ? 'nav-item active sub-item' : 'nav-item sub-item'}
                  onClick={() => handleMenuItemClick('overview')}
                >
                  <IonIcon icon={statsChartOutline} slot="start" />
                  <IonLabel>Overview</IonLabel>
                </IonItem>
              </IonMenuToggle>

              <IonMenuToggle autoHide={false}>
                <IonItem
                  button
                  className={activeSection === 'employees' ? 'nav-item active sub-item' : 'nav-item sub-item'}
                  onClick={() => handleMenuItemClick('employees')}
                >
                  <IonIcon icon={peopleOutline} slot="start" />
                  <IonLabel>Employees</IonLabel>
                </IonItem>
              </IonMenuToggle>

              <IonMenuToggle autoHide={false}>
                <IonItem
                  button
                  className={activeSection === 'leaves' ? 'nav-item active sub-item' : 'nav-item sub-item'}
                  onClick={() => handleMenuItemClick('leaves')}
                >
                  <IonIcon icon={documentTextOutline} slot="start" />
                  <IonLabel>Leave Requests</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </>
          )}

          <IonMenuToggle autoHide={false}>
            <IonItem
              button
              className="nav-item logout-item"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} slot="start" color="danger" />
              <IonLabel color="danger">Logout</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default SideNavigation;
