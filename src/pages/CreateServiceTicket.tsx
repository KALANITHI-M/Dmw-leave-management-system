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
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonIcon,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/react';
import { arrowBack, close, cloudUpload } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { serviceTicketService } from '../api/serviceTicketService';
import { employeeService, Employee } from '../api/employeeService';
import { useAuth } from '../context/AuthContext';
import './CreateServiceTicket.css';

interface Attachment {
  file: File;
  name: string;
  size: number;
}

const CreateServiceTicket: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Other');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const [serviceEngineers, setServiceEngineers] = useState<Employee[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [loadingEngineers, setLoadingEngineers] = useState(false);

  // Check if user is service engineer - they cannot create tickets
  const isServiceEngineer = user?.role === 'service engineer' || user?.designation === 'service engineer';

  useEffect(() => {
    loadServiceEngineers();
  }, []);

  const loadServiceEngineers = async () => {
    setLoadingEngineers(true);
    try {
      const employees = await employeeService.getAllEmployees();
      // Filter for service engineers only
      const engineers = employees.filter(
        (emp) => emp.designation === 'service engineer'
      );
      setServiceEngineers(engineers);
      console.log('[DEBUG] Loaded service engineers:', engineers.length);
    } catch (error: any) {
      console.error('[ERROR] Failed to load service engineers:', error);
      showError('Failed to load service engineers');
    } finally {
      setLoadingEngineers(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showError(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        showError(`File type not allowed: ${file.name}`);
        continue;
      }

      setAttachments((prev) => [
        ...prev,
        {
          file,
          name: file.name,
          size: file.size,
        },
      ]);
    }

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async () => {
    // Validation
    if (!title.trim()) {
      showError('Please enter a ticket title');
      return;
    }
    if (!description.trim()) {
      showError('Please enter a ticket description');
      return;
    }
    if (!priority) {
      showError('Please select a priority level');
      return;
    }
    if (!selectedEngineer) {
      showError('Please assign this ticket to a service engineer');
      return;
    }

    try {
      setLoading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('category', category);
      formData.append('assignedTo', selectedEngineer);
      if (dueDate) {
        formData.append('dueDate', dueDate);
      }

      // Add attachments
      console.log('[DEBUG] Adding attachments:', attachments.length);
      attachments.forEach((att) => {
        formData.append('attachments', att.file);
      });

      console.log('[DEBUG] Creating ticket with title:', title, 'assigned to:', selectedEngineer);
      const response = await serviceTicketService.createTicket(formData);
      
      if (response.ticket && response.ticket.ticketNumber) {
        showSuccessMessage(`Ticket ${response.ticket.ticketNumber} created successfully!`);
        
        // Redirect after 1 second
        setTimeout(() => {
          history.push('/service-tickets');
        }, 1000);
      } else {
        showError('Unexpected response format from server');
      }
    } catch (error: any) {
      console.error('[ERROR] Ticket creation error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create ticket';
      const errorDetails = error.response?.data?.error || '';
      
      showError(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Service engineers cannot create tickets
  if (isServiceEngineer) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Create Service Ticket</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardContent>
              <IonText color="danger">
                <p style={{ textAlign: 'center', marginTop: '2rem' }}>
                  ⚠️ <strong>Access Denied</strong>
                </p>
                <p style={{ textAlign: 'center' }}>
                  Service Engineers cannot create new tickets. Your role is to work on assigned tickets.
                </p>
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <IonButton expand="block" onClick={() => history.push('/service-tickets')}>
                    View My Assigned Tickets
                  </IonButton>
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
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
          <IonTitle>Create Service Ticket</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding create-ticket-content">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Ticket Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Title */}
            <IonItem>
              <IonLabel position="stacked">
                Ticket Title <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                type="text"
                placeholder="Enter ticket title"
                value={title}
                onIonChange={(e) => setTitle(e.detail.value || '')}
                disabled={loading}
              />
            </IonItem>

            {/* Description */}
            <IonItem>
              <IonLabel position="stacked">
                Description <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonTextarea
                placeholder="Describe the issue or request in detail"
                value={description}
                onIonChange={(e) => setDescription(e.detail.value || '')}
                rows={5}
                disabled={loading}
              />
            </IonItem>

            {/* Priority */}
            <IonItem>
              <IonLabel position="stacked">
                Priority <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={priority}
                onIonChange={(e) => setPriority(e.detail.value)}
                disabled={loading}
              >
                <IonSelectOption value="Low">Low</IonSelectOption>
                <IonSelectOption value="Medium">Medium</IonSelectOption>
                <IonSelectOption value="High">High</IonSelectOption>
                <IonSelectOption value="Critical">Critical</IonSelectOption>
              </IonSelect>
            </IonItem>

            {/* Category */}
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={category}
                onIonChange={(e) => setCategory(e.detail.value)}
                disabled={loading}
              >
                <IonSelectOption value="Machine Failure">Machine Failure</IonSelectOption>
                <IonSelectOption value="Maintenance Request">Maintenance Request</IonSelectOption>
                <IonSelectOption value="Technical Support">Technical Support</IonSelectOption>
                <IonSelectOption value="Software Issue">Software Issue</IonSelectOption>
                <IonSelectOption value="Hardware Issue">Hardware Issue</IonSelectOption>
                <IonSelectOption value="Other">Other</IonSelectOption>
              </IonSelect>
            </IonItem>

            {/* Assign to Service Engineer */}
            <IonItem>
              <IonLabel position="stacked">
                Assign to Service Engineer <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              {loadingEngineers ? (
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IonSpinner name="crescent" style={{ width: '20px', height: '20px' }} />
                  <span>Loading engineers...</span>
                </div>
              ) : (
                <IonSelect
                  value={selectedEngineer}
                  onIonChange={(e) => setSelectedEngineer(e.detail.value)}
                  disabled={loading || loadingEngineers || serviceEngineers.length === 0}
                  placeholder="Select a service engineer"
                >
                  {serviceEngineers.length === 0 ? (
                    <IonSelectOption value="" disabled>
                      No service engineers available
                    </IonSelectOption>
                  ) : (
                    serviceEngineers.map((engineer) => (
                      <IonSelectOption key={engineer._id} value={engineer._id}>
                        {engineer.name} ({engineer.employeeId})
                      </IonSelectOption>
                    ))
                  )}
                </IonSelect>
              )}
            </IonItem>

            {/* Due Date */}
            <IonItem>
              <IonLabel position="stacked">Expected Due Date (Optional)</IonLabel>
              <IonInput
                type="date"
                value={dueDate}
                onIonChange={(e) => setDueDate(e.detail.value || '')}
                disabled={loading}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Attachments Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Attachments (Optional)</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <small>
                Upload photos or documents (JPG, PNG, PDF, DOCX) - Max 10MB each. Maximum 5 files.
              </small>
            </IonText>

            {/* File Input */}
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
                  transition: 'all 0.3s ease',
                }}
              >
                <IonIcon
                  icon={cloudUpload}
                  style={{ fontSize: '2rem', color: '#667eea', marginBottom: '0.5rem' }}
                />
                <p style={{ margin: '0.5rem 0 0 0', color: '#667eea', fontWeight: '600' }}>
                  Click to choose files or drag and drop
                </p>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  disabled={loading || attachments.length >= 5}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <IonText>
                  <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Selected Files:</p>
                </IonText>
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>
                        {att.name}
                      </p>
                      <small style={{ color: '#888' }}>
                        {(att.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => removeAttachment(index)}
                      disabled={loading}
                    >
                      <IonIcon slot="icon-only" icon={close} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <IonButton
            expand="block"
            fill="clear"
            onClick={() => history.goBack()}
            disabled={loading}
          >
            Cancel
          </IonButton>
          <IonButton
            expand="block"
            color="primary"
            onClick={handleCreateTicket}
            disabled={loading || !title.trim() || !description.trim()}
          >
            {loading ? <IonSpinner name="dots" /> : 'Create Ticket'}
          </IonButton>
        </div>

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

export default CreateServiceTicket;
