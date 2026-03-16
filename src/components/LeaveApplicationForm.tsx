import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonDatetime,
  IonBadge,
} from '@ionic/react';
import { leaveService, LeaveApplication, LeaveBalance } from '../api/leaveService';
import './LeaveApplicationForm.css';

interface LeaveApplicationFormProps {
  onSuccess: () => void;
}

const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const proofInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    leaveService.getMyBalance().then(setLeaveBalance).catch(() => {});
  }, []);

  const getRemainingDays = (type: string): number | null => {
    if (!leaveBalance) return null;
    const entry = leaveBalance.balances.find((b) => b.leaveType === type);
    if (!entry) return null;
    return Math.round((entry.allocated - entry.used - entry.pending) * 2) / 2;
  };

  const getBalanceColor = (remaining: number | null, allocated: number | undefined) => {
    if (remaining === null) return 'medium';
    if (remaining <= 0) return 'danger';
    if (allocated !== undefined && remaining <= allocated * 0.3) return 'warning';
    return 'success';
  };

  type ShiftType = 'full' | 'first-half' | 'second-half';

  const [formData, setFormData] = useState({
    leaveType: '',
    dayType: 'single',
    fromDate: '',
    toDate: '',
    shift: 'full' as ShiftType,
    multiStartShift: 'full' as ShiftType,
    multiEndShift: 'full' as ShiftType,
    reason: '',
    description: '',
  });

  const shiftLabel = (shift: ShiftType) => {
    switch (shift) {
      case 'first-half':
        return 'First Half';
      case 'second-half':
        return 'Second Half';
      default:
        return 'Full Day';
    }
  };

  const getInclusiveDateDiffDays = (startISO: string, endISO: string) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateDays = () => {
    if (formData.dayType === 'single') {
      return formData.shift === 'full' ? 1 : 0.5;
    }
    if (formData.fromDate && formData.toDate) {
      const diffDays = getInclusiveDateDiffDays(formData.fromDate, formData.toDate);

      // If user selects same start & end date in multi-day mode, interpret it like a single-day leave
      // using the start shift selection.
      if (diffDays === 1) {
        return formData.multiStartShift === 'full' ? 1 : 0.5;
      }

      let numberOfDays = diffDays;
      if (formData.multiStartShift !== 'full') numberOfDays -= 0.5;
      if (formData.multiEndShift !== 'full') numberOfDays -= 0.5;

      return Math.max(0.5, numberOfDays);
    }
    return 0;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.leaveType) {
      setToastMessage('Please select leave type');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!formData.fromDate) {
      setToastMessage('Please select leave date');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (formData.dayType === 'multi' && !formData.toDate) {
      setToastMessage('Please select end date for multi-day leave');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!formData.reason) {
      setToastMessage('Please provide leave reason');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Frontend balance guard (backend will also reject if insufficient)
    const numberOfDays = calculateDays();

    // Require proof for 5+ day leaves
    if (numberOfDays >= 5 && !proofFile) {
      setToastMessage('Please upload a proof document for leaves of 5 or more days.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const remaining = getRemainingDays(formData.leaveType);
    if (remaining !== null && remaining < numberOfDays) {
      setToastMessage(
        `Insufficient balance. You have ${remaining} day(s) remaining for ${formData.leaveType}.`
      );
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const shiftPrefix =
      formData.dayType === 'single'
        ? `${shiftLabel(formData.shift)} - `
        : formData.fromDate && formData.toDate
          ? `Start: ${shiftLabel(formData.multiStartShift)}, End: ${shiftLabel(formData.multiEndShift)} - `
          : '';

    const leaveData: LeaveApplication = {
      leaveType: formData.leaveType,
      startDate: formData.fromDate,
      endDate: formData.dayType === 'multi' && formData.toDate ? formData.toDate : formData.fromDate,
      numberOfDays,
      reason: `${shiftPrefix}${formData.description || formData.reason}`,
    };

    setLoading(true);
    try {
      const createdLeave = await leaveService.applyLeave(leaveData);

      // Upload proof if provided (only shown when days >= 5)
      if (proofFile && createdLeave._id) {
        try {
          await leaveService.uploadProof(createdLeave._id, proofFile);
        } catch {
          // leave was submitted; proof upload failed silently — notify user
          setToastMessage('Leave submitted but proof upload failed. You can contact HR.');
          setToastColor('danger');
          setShowToast(true);
          setTimeout(() => { onSuccess(); }, 2000);
          return;
        }
      }

      setToastMessage('Leave application submitted successfully!');
      setToastColor('success');
      setShowToast(true);
      
      // Reset form
      setFormData({
        leaveType: '',
        dayType: 'single',
        fromDate: '',
        toDate: '',
        shift: 'full',
        multiStartShift: 'full',
        multiEndShift: 'full',
        reason: '',
        description: '',
      });
      setProofFile(null);
      if (proofInputRef.current) proofInputRef.current.value = '';

      setTimeout(() => {
        onSuccess();
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to apply for leave');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
      // Refresh balance after submission
      leaveService.getMyBalance().then(setLeaveBalance).catch(() => {});
    }
  };

  return (
    <div className="leave-application-container">
      <IonCard className="leave-form-card">
        <IonCardHeader className="leave-form-header">
          <IonCardTitle>LEAVE APPLICATION</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            {/* Leave Type */}
            <IonRow>
              <IonCol size="12">
                <IonItem className="form-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE TYPE <span className="required">*</span>
                  </IonLabel>
                  <IonSelect
                    value={formData.leaveType}
                    placeholder="Select"
                    onIonChange={(e) => setFormData({ ...formData, leaveType: e.detail.value })}
                    interface="popover"
                    className="form-select"
                  >
                    <IonSelectOption value="Sick Leave">Sick Leave</IonSelectOption>
                    <IonSelectOption value="Casual Leave">Casual Leave</IonSelectOption>
                    <IonSelectOption value="Earned Leave">Earned Leave</IonSelectOption>
                    <IonSelectOption value="Maternity Leave">Maternity Leave</IonSelectOption>
                    <IonSelectOption value="Paternity Leave">Paternity Leave</IonSelectOption>
                    <IonSelectOption value="Other">Other</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Balance indicator for selected leave type */}
                {formData.leaveType && (() => {
                  const alloc = leaveBalance?.balances.find(b => b.leaveType === formData.leaveType);
                  const rem = getRemainingDays(formData.leaveType);
                  return (
                    <div className="balance-indicator">
                      <span className="balance-label">Leave Balance:</span>
                      <IonBadge color={getBalanceColor(rem, alloc?.allocated)} className="balance-badge">
                        {rem !== null ? `${rem} / ${alloc?.allocated ?? '—'} days remaining` : 'Loading...'}
                      </IonBadge>
                    </div>
                  );
                })()}
              </IonCol>
            </IonRow>

            {/* Day Type */}
            <IonRow>
              <IonCol size="12">
                <IonLabel className="form-label section-label">DAY</IonLabel>
                <IonRadioGroup
                  value={formData.dayType}
                  onIonChange={(e) =>
                    setFormData({
                      ...formData,
                      dayType: e.detail.value,
                      toDate: '',
                      shift: 'full',
                      multiStartShift: 'full',
                      multiEndShift: 'full',
                    })
                  }
                  className="day-type-radio"
                >
                  <IonItem lines="none">
                    <IonRadio value="single" justify="start">Single</IonRadio>
                  </IonItem>
                  <IonItem lines="none">
                    <IonRadio value="multi" justify="start">Multi</IonRadio>
                  </IonItem>
                </IonRadioGroup>
              </IonCol>
            </IonRow>

            {/* Shift (for multi day) */}
            {formData.dayType === 'multi' && (
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonLabel className="form-label section-label">FROM SESSION</IonLabel>
                  <IonRadioGroup
                    value={formData.multiStartShift}
                    onIonChange={(e) =>
                      setFormData({
                        ...formData,
                        multiStartShift: e.detail.value,
                      })
                    }
                    className="shift-type-radio"
                  >
                    <IonItem lines="none">
                      <IonRadio value="full" justify="start">Full Day</IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio value="first-half" justify="start">First Half</IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio value="second-half" justify="start">Second Half</IonRadio>
                    </IonItem>
                  </IonRadioGroup>
                </IonCol>

                <IonCol size="12" sizeMd="6">
                  <IonLabel className="form-label section-label">TO SESSION</IonLabel>
                  <IonRadioGroup
                    value={formData.multiEndShift}
                    onIonChange={(e) =>
                      setFormData({
                        ...formData,
                        multiEndShift: e.detail.value,
                      })
                    }
                    className="shift-type-radio"
                  >
                    <IonItem lines="none">
                      <IonRadio value="full" justify="start">Full Day</IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio value="first-half" justify="start">First Half</IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio value="second-half" justify="start">Second Half</IonRadio>
                    </IonItem>
                  </IonRadioGroup>
                </IonCol>
              </IonRow>
            )}

            {/* Leave Date(s) */}
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonItem className="form-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE ON <span className="required">*</span>
                  </IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={formData.fromDate}
                    onIonChange={(e) => setFormData({ ...formData, fromDate: e.detail.value as string || '' })}
                    className="form-input"
                  />
                </IonItem>
              </IonCol>
              {formData.dayType === 'multi' && (
                <IonCol size="12" sizeMd="6">
                  <IonItem className="form-item">
                    <IonLabel position="stacked" className="form-label">TO DATE</IonLabel>
                    <IonDatetime
                      presentation="date"
                      value={formData.toDate}
                      onIonChange={(e) => setFormData({ ...formData, toDate: e.detail.value as string || '' })}
                      min={formData.fromDate}
                      className="form-input"
                    />
                  </IonItem>
                </IonCol>
              )}
            </IonRow>

            {/* Shift (for single day only) */}
            {formData.dayType === 'single' && (
              <IonRow>
                <IonCol size="12">
                  <IonLabel className="form-label section-label">
                    SHIFT <span className="optional">(IT standard)</span>
                  </IonLabel>
                  <IonRadioGroup
                    value={formData.shift}
                    onIonChange={(e) =>
                      setFormData({
                        ...formData,
                        shift: e.detail.value,
                      })
                    }
                    className="shift-type-radio"
                  >
                    <IonItem lines="none">
                      <IonRadio value="full" justify="start">Full Day</IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio value="first-half" justify="start">First Half</IonRadio>
                    </IonItem>
                    <IonItem lines="none">
                      <IonRadio value="second-half" justify="start">Second Half</IonRadio>
                    </IonItem>
                  </IonRadioGroup>
                </IonCol>
              </IonRow>
            )}

            {/* Leave Reason */}
            <IonRow>
              <IonCol size="12">
                <IonItem className="form-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE REASON <span className="required">*</span>
                  </IonLabel>
                  <IonInput
                    value={formData.reason}
                    placeholder="Brief reason for leave"
                    onIonInput={(e) => setFormData({ ...formData, reason: e.detail.value || '' })}
                    className="form-input"
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Leave Description */}
            <IonRow>
              <IonCol size="12">
                <IonItem className="form-item textarea-item">
                  <IonLabel position="stacked" className="form-label">
                    LEAVE DESCRIPTION <span className="required">*</span>
                  </IonLabel>
                  <IonTextarea
                    value={formData.description}
                    placeholder="Detailed description..."
                    rows={4}
                    maxlength={500}
                    onIonInput={(e) => setFormData({ ...formData, description: e.detail.value || '' })}
                    className="form-textarea"
                  />
                  <p className="char-count">You have {500 - (formData.description?.length || 0)} chars left</p>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Proof of Leave (only shown when leave >= 5 days) */}
            {calculateDays() >= 5 && (
              <IonRow>
                <IonCol size="12">
                  <div className="proof-upload-section">
                    <p className="proof-upload-label">
                      PROOF OF LEAVE <span className="required">*</span>
                      <span className="proof-hint"> (Required for 5+ day leaves — JPG, PNG or PDF, max 5MB)</span>
                    </p>
                    <input
                      ref={proofInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="proof-file-input"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                    {proofFile && (
                      <p className="proof-file-name">Selected: {proofFile.name}</p>
                    )}
                  </div>
                </IonCol>
              </IonRow>
            )}

            {/* Submit Button */}
            <IonRow>
              <IonCol size="12">
                <div className="form-actions">
                  <IonButton
                    expand="block"
                    onClick={handleSubmit}
                    className="submit-btn"
                    disabled={loading}
                  >
                    Submit
                  </IonButton>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <IonLoading isOpen={loading} message="Submitting..." />
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
      />
    </div>
  );
};

export default LeaveApplicationForm;
