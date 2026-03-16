import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonAlert,
  IonToast,
} from '@ionic/react';
import { addOutline, createOutline, trashOutline, timeOutline, peopleOutline } from 'ionicons/icons';
import { shiftService, Shift, EmployeeWithShift, CreateShiftData } from '../api/shiftService';
import './ShiftManagement.css';

const emptyForm: CreateShiftData = {
  name: '',
  startTime: '09:00',
  endTime: '18:00',
  lateAfterMinutes: 30,
  workingHours: 8,
};

const ShiftManagement: React.FC = () => {
  const [tab, setTab] = useState<'shifts' | 'assignments'>('shifts');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithShift[]>([]);
  const [loading, setLoading] = useState(false);

  // Shift form modal
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [form, setForm] = useState<CreateShiftData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  // Error toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'danger' | 'success'>('danger');

  const showError = (msg: string) => {
    setToastMsg(msg);
    setToastColor('danger');
    setToastOpen(true);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'shifts') {
        const data = await shiftService.getAllShifts();
        setShifts(data);
      } else {
        const [shiftsData, empsData] = await Promise.all([
          shiftService.getAllShifts(),
          shiftService.getEmployeesWithShifts(),
        ]);
        setShifts(shiftsData);
        setEmployees(empsData);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { showError(e.response?.data?.message || 'Failed to load shift data'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingShift(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateAfterMinutes: shift.lateAfterMinutes,
      workingHours: shift.workingHours,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.startTime || !form.endTime) return;
    setSaving(true);
    try {
      if (editingShift) {
        await shiftService.updateShift(editingShift._id, form);
      } else {
        await shiftService.createShift(form);
      }
      setShowModal(false);
      await loadData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { showError(e.response?.data?.message || 'Failed to save shift'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (shift: Shift) => {
    try {
      await shiftService.deleteShift(shift._id);
      setDeleteTarget(null);
      await loadData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { showError(e.response?.data?.message || 'Failed to delete shift'); }
  };

  const handleAssign = async (employeeId: string, shiftId: string | null) => {
    try {
      const updated = await shiftService.assignShift(employeeId, shiftId || null);
      setEmployees((prev) =>
        prev.map((e) => (e._id === updated._id ? { ...e, shift: updated.shift } : e))
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { showError(e.response?.data?.message || 'Failed to assign shift'); }
  };

  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className="shift-management">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Shift Management</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as any)}>
            <IonSegmentButton value="shifts">
              <IonIcon icon={timeOutline} />
              <IonLabel>Shifts</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="assignments">
              <IonIcon icon={peopleOutline} />
              <IonLabel>Assignments</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {loading ? (
            <div className="shift-spinner">
              <IonSpinner />
            </div>
          ) : tab === 'shifts' ? (
            /* ── Shifts tab ── */
            <>
              <div className="shift-tab-header">
                <IonButton size="small" onClick={openCreate}>
                  <IonIcon icon={addOutline} slot="start" />
                  New Shift
                </IonButton>
              </div>

              {shifts.length === 0 ? (
                <p className="no-data-text">No shifts defined yet. Click "New Shift" to create one.</p>
              ) : (
                <IonGrid className="shift-grid">
                  <IonRow className="shift-grid-header">
                    <IonCol size="3"><strong>Name</strong></IonCol>
                    <IonCol size="2"><strong>Start</strong></IonCol>
                    <IonCol size="2"><strong>End</strong></IonCol>
                    <IonCol size="2"><strong>Late After</strong></IonCol>
                    <IonCol size="1"><strong>Hrs</strong></IonCol>
                    <IonCol size="2"><strong>Actions</strong></IonCol>
                  </IonRow>
                  {shifts.map((shift) => (
                    <IonRow key={shift._id} className="shift-grid-row">
                      <IonCol size="3">
                        <span className="shift-name">{shift.name}</span>
                        {!shift.isActive && (
                          <IonBadge color="medium" className="inactive-badge">Inactive</IonBadge>
                        )}
                      </IonCol>
                      <IonCol size="2">{fmt(shift.startTime)}</IonCol>
                      <IonCol size="2">{fmt(shift.endTime)}</IonCol>
                      <IonCol size="2">{shift.lateAfterMinutes} min</IonCol>
                      <IonCol size="1">{shift.workingHours}h</IonCol>
                      <IonCol size="2" className="shift-actions">
                        <IonButton fill="clear" size="small" onClick={() => openEdit(shift)}>
                          <IonIcon icon={createOutline} />
                        </IonButton>
                        <IonButton fill="clear" size="small" color="danger" onClick={() => setDeleteTarget(shift)}>
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  ))}
                </IonGrid>
              )}
            </>
          ) : (
            /* ── Assignments tab ── */
            <>
              <p className="assignments-hint">
                Assign a shift to each employee. The attendance late threshold and half-day threshold will automatically adjust based on the assigned shift.
              </p>
              {employees.length === 0 ? (
                <p className="no-data-text">No employees found.</p>
              ) : (
                <IonList className="assignments-list">
                  {employees.map((emp) => (
                    <IonItem key={emp._id} className="assignment-item">
                      <IonLabel>
                        <h2>{emp.name}</h2>
                        <p>{emp.employeeId} · {emp.department} · {emp.designation}</p>
                      </IonLabel>
                      <IonSelect
                        placeholder="No shift assigned"
                        value={emp.shift?._id ?? ''}
                        onIonChange={(e) => handleAssign(emp._id, e.detail.value || null)}
                        className="shift-select"
                        interface="popover"
                      >
                        <IonSelectOption value="">No shift</IonSelectOption>
                        {shifts.map((s) => (
                          <IonSelectOption key={s._id} value={s._id}>
                            {s.name} ({fmt(s.startTime)} – {fmt(s.endTime)})
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                      {emp.shift && (
                        <IonBadge color="primary" slot="end" className="assigned-badge">
                          {emp.shift.name}
                        </IonBadge>
                      )}
                    </IonItem>
                  ))}
                </IonList>
              )}
            </>
          )}
        </IonCardContent>
      </IonCard>

      {/* ── Create / Edit Shift Modal ── */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingShift ? 'Edit Shift' : 'New Shift'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Shift Name *</IonLabel>
            <IonInput
              value={form.name}
              placeholder="e.g. Morning Shift"
              onIonInput={(e) => setForm({ ...form, name: e.detail.value as string })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Start Time * (24h format, e.g. 09:30)</IonLabel>
            <IonInput
              value={form.startTime}
              placeholder="09:30"
              onIonInput={(e) => setForm({ ...form, startTime: e.detail.value as string })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">End Time * (24h format, e.g. 18:30)</IonLabel>
            <IonInput
              value={form.endTime}
              placeholder="18:30"
              onIonInput={(e) => setForm({ ...form, endTime: e.detail.value as string })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Late After (minutes after start time)</IonLabel>
            <IonInput
              type="number"
              value={form.lateAfterMinutes}
              min={0}
              max={120}
              onIonInput={(e) =>
                setForm({ ...form, lateAfterMinutes: parseInt(e.detail.value as string) || 0 })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Working Hours per Day</IonLabel>
            <IonInput
              type="number"
              value={form.workingHours}
              min={1}
              max={24}
              onIonInput={(e) =>
                setForm({ ...form, workingHours: parseFloat(e.detail.value as string) || 8 })
              }
            />
          </IonItem>

          <div className="modal-save-btn">
            <IonButton expand="block" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <IonSpinner name="crescent" /> : editingShift ? 'Update Shift' : 'Create Shift'}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* ── Delete Confirmation Alert ── */}
      <IonAlert
        isOpen={!!deleteTarget}
        header="Delete Shift"
        message={`Delete "${deleteTarget?.name}"? Employees assigned to this shift will be unassigned.`}
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setDeleteTarget(null) },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => { if (deleteTarget) handleDelete(deleteTarget); },
          },
        ]}
        onDidDismiss={() => setDeleteTarget(null)}
      />

      <IonToast
        isOpen={toastOpen}
        onDidDismiss={() => setToastOpen(false)}
        message={toastMsg}
        duration={3500}
        color={toastColor}
        position="bottom"
      />
    </div>
  );
};

export default ShiftManagement;
