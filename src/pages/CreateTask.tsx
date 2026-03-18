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
  IonCheckbox,
  IonText,
  IonSpinner,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonButtons,
} from '@ionic/react';
import { checkmark, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { taskService } from '../api/taskService';
import { employeeService } from '../api/employeeService';
import './CreateTask.css';

interface Employee {
  _id: string;
  name: string;
  designation: string;
  email: string;
  role?: 'employee' | 'hr';
  isActive?: boolean;
}

const CreateTask: React.FC = () => {
  const history = useHistory();
  
  // Handle back navigation
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (history.length > 1) {
      history.goBack();
    } else {
      history.push('/hr/dashboard');
    }
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [priority, setPriority] = useState('Medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response: any = await employeeService.getAllEmployees();
      const allEmployees = Array.isArray(response) ? response : response.employees;
      const assignableEmployees = (allEmployees || []).filter(
        (emp: Employee) => emp.role === 'employee' && emp.isActive !== false
      );
      setEmployees(assignableEmployees);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (selectedEmployees.length === 0) newErrors.employees = 'Select at least one employee';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        newErrors.dueDate = 'Due date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        assignedTo: selectedEmployees,
        priority,
        startDate,
        dueDate,
      };

      await taskService.createTask(taskData);
      showSuccessMessage('Task created successfully');
      setTimeout(() => {
        if (history.length > 1) {
          history.goBack();
        } else {
          history.push('/hr/dashboard');
        }
      }, 1500);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleClear = () => {
    if (window.confirm('Clear all fields?')) {
      setTitle('');
      setDescription('');
      setSelectedEmployees([]);
      setPriority('Medium');
      setStartDate('');
      setDueDate('');
      setErrors({});
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

  if (loadingEmployees) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleBackClick}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Create Task</IonTitle>
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
            <IonButton onClick={handleBackClick}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Create Task</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding create-task-content">
        <div className="create-task-container">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Task Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem className={errors.title ? 'has-error' : ''}>
                <IonLabel position="stacked">
                  Task Title <span className="required">*</span>
                </IonLabel>
                <IonInput
                  value={title}
                  onIonChange={(e) => {
                    setTitle(e.detail.value!);
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  placeholder="e.g., Complete Project Report"
                  disabled={submitting}
                />
              </IonItem>
              {errors.title && <IonText color="danger" className="error-message">{errors.title}</IonText>}

              <IonItem className={errors.description ? 'has-error' : ''}>
                <IonLabel position="stacked">
                  Description <span className="required">*</span>
                </IonLabel>
                <IonTextarea
                  value={description}
                  onIonChange={(e) => {
                    setDescription(e.detail.value!);
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  placeholder="Provide detailed task description..."
                  rows={4}
                  disabled={submitting}
                />
              </IonItem>
              {errors.description && <IonText color="danger" className="error-message">{errors.description}</IonText>}

              <IonItem className="priority-item">
                <IonLabel position="stacked">
                  Priority <span className="required">*</span>
                </IonLabel>
                <IonSelect value={priority} onIonChange={(e) => setPriority(e.detail.value)} disabled={submitting}>
                  <IonSelectOption value="Low">Low</IonSelectOption>
                  <IonSelectOption value="Medium">Medium</IonSelectOption>
                  <IonSelectOption value="High">High</IonSelectOption>
                  <IonSelectOption value="Critical">Critical</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Timeline</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem className={errors.startDate ? 'has-error' : ''}>
                <IonLabel position="stacked">
                  Start Date <span className="required">*</span>
                </IonLabel>
                <IonInput
                  type="date"
                  value={startDate}
                  onIonChange={(e) => {
                    setStartDate(e.detail.value!);
                    if (errors.startDate) setErrors({ ...errors, startDate: '' });
                  }}
                  disabled={submitting}
                />
              </IonItem>
              {errors.startDate && <IonText color="danger" className="error-message">{errors.startDate}</IonText>}

              <IonItem className={errors.dueDate ? 'has-error' : ''}>
                <IonLabel position="stacked">
                  Due Date <span className="required">*</span>
                </IonLabel>
                <IonInput
                  type="date"
                  value={dueDate}
                  onIonChange={(e) => {
                    setDueDate(e.detail.value!);
                    if (errors.dueDate) setErrors({ ...errors, dueDate: '' });
                  }}
                  disabled={submitting}
                />
              </IonItem>
              {errors.dueDate && <IonText color="danger" className="error-message">{errors.dueDate}</IonText>}
            </IonCardContent>
          </IonCard>

          <IonCard className={errors.employees ? 'has-error' : ''}>
            <IonCardHeader>
              <IonCardTitle>
                Assign To Employees <span className="required">*</span>
              </IonCardTitle>
              <p className="card-subtitle">
                Selected: {selectedEmployees.length} {selectedEmployees.length === 1 ? 'employee' : 'employees'}
              </p>
            </IonCardHeader>
            <IonCardContent>
              {employees.length === 0 ? (
                <IonText color="medium">
                  <p>No employees available</p>
                </IonText>
              ) : (
                <div className="employee-list">
                  {employees.map((emp) => (
                    <IonItem key={emp._id} className="employee-item">
                      <IonCheckbox
                        checked={selectedEmployees.includes(emp._id)}
                        onIonChange={() => toggleEmployee(emp._id)}
                        disabled={submitting}
                        slot="start"
                      />
                      <div className="employee-info">
                        <div className="employee-name">{emp.name}</div>
                        <div className="employee-designation">{emp.designation}</div>
                      </div>
                    </IonItem>
                  ))}
                </div>
              )}
              {errors.employees && <IonText color="danger" className="error-message">{errors.employees}</IonText>}
            </IonCardContent>
          </IonCard>

          <div className="form-actions">
            <IonButton
              expand="block"
              fill="solid"
              color="success"
              onClick={handleSubmit}
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? (
                <>
                  <IonSpinner name="dots" />
                  Creating...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={checkmark} />
                  Create Task
                </>
              )}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={handleClear}
              disabled={submitting}
            >
              Clear Form
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              onClick={handleBackClick}
              disabled={submitting}
            >
              Cancel
            </IonButton>
          </div>
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

export default CreateTask;
