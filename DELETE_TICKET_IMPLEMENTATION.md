# Delete Service Ticket Implementation

## Overview
Implemented complete ticket deletion functionality for the Service Ticket Management module. Users (HR and ticket creators) can now delete tickets that are in "Open" or "Assigned" status.

## Features Implemented

### 1. Backend Controller (`serviceTicketController.js`)
✅ Added `deleteServiceTicket` function with:
- **Permission checks**: Only HR or ticket creator can delete
- **Status validation**: Only tickets with "Open" or "Assigned" status can be deleted
- **Cascading delete**: Automatically deletes all related comments and activity logs
- **Error handling**: Clear error messages for permission and status violations

### 2. Backend Routes (`serviceTicketRoutes.js`)
✅ Added DELETE route:
```javascript
router.delete('/:id', deleteServiceTicket);
```

### 3. Frontend API Service (`serviceTicketService.ts`)
✅ Added `deleteTicket` method:
```typescript
deleteTicket: async (ticketId: string) => {
  const response = await axiosInstance.delete(`${SERVICE_TICKETS_API}/${ticketId}`);
  return response.data;
}
```

### 4. Frontend UI (`ServiceTicketManagement.tsx`)
✅ Added delete button with:
- **Trash icon**: Red delete button next to view button
- **Confirmation dialog**: Uses `useIonAlert` to confirm deletion before proceeding
- **Conditional rendering**: Delete button only shows when:
  - User is HR, OR
  - User is the ticket creator (employee), AND
  - Ticket status is "Open" or "Assigned"
- **Toast notifications**: Success/error messages after deletion
- **Auto-refresh**: Ticket list refreshes after successful deletion

## User Permissions

### Who Can Delete?
1. **HR Staff**: Can delete any ticket in "Open" or "Assigned" status
2. **Ticket Creator (Employee)**: Can delete their own tickets in "Open" or "Assigned" status
3. **Service Engineers**: Cannot delete tickets (they only view assigned tickets)

### When Can Delete?
- ✅ Ticket status is "Open"
- ✅ Ticket status is "Assigned"
- ❌ Cannot delete: In Progress, Resolved, Closed, On Hold, Reopened

## Technical Details

### Backend Logic
```javascript
// Required checks:
if (userRole !== 'hr' && ticket.createdBy.toString() !== userId.toString()) {
  return 403 (Forbidden)
}

if (!['Open', 'Assigned'].includes(ticket.status)) {
  return 400 (Bad Request)
}
```

### Frontend UI Logic
```jsx
{(isHR || (isEmployee && !isServiceEngineer && ticket.createdBy?._id === user?._id)) &&
  ['Open', 'Assigned'].includes(ticket.status) && (
    <IonButton color="danger" onClick={() => handleDeleteTicket(...)}>
      <IonIcon slot="icon-only" icon={trash} />
    </IonButton>
  )}
```

### Deletion Cascade
When a ticket is deleted:
1. All `ServiceTicketComment` records are deleted
2. All `ServiceTicketActivity` (logs) records are deleted
3. The `ServiceTicket` record itself is deleted
4. Frontend refreshes the ticket list automatically

## Testing Scenarios

### ✅ Test Case 1: HR Deletes Ticket
1. Log in as HR user
2. Go to Service Tickets
3. Find an "Open" or "Assigned" ticket
4. Click red trash icon
5. Confirm deletion
6. Ticket should disappear from list
7. Success message displayed

### ✅ Test Case 2: Employee Deletes Own Ticket
1. Log in as employee
2. Go to Service Tickets  
3. Find own ticket in "Open" or "Assigned" status
4. Red trash icon should be visible
5. Click and confirm deletion
6. Ticket removed from list

### ❌ Test Case 3: Employee Cannot Delete Others' Tickets
1. Employee should NOT see trash icon on tickets created by other employees
2. Attempting direct API call should return 403 Forbidden

### ❌ Test Case 4: Cannot Delete In-Progress Tickets
1. When ticket is "In Progress", trash icon should NOT appear
2. HR clicking trash should fail with "Cannot delete ticket in 'In Progress' status"

### ❌ Test Case 5: Service Engineer Cannot Delete
1. Service engineer dashboard should NOT show delete button
2. API should return 403 Forbidden if they attempt deletion

## Files Modified

1. **Backend**
   - `backend/controllers/serviceTicketController.js` (+40 lines)
   - `backend/routes/serviceTicketRoutes.js` (+1 line import, +1 line route)

2. **Frontend**
   - `src/pages/ServiceTicketManagement.tsx` (+improvements)
   - `src/api/serviceTicketService.ts` (+12 lines)

## Error Handling

### Error Responses
- **400 Bad Request**: Ticket not found or invalid status
- **403 Forbidden**: User lacks permission to delete
- **500 Server Error**: Database/server error

### User Messages
- Success: "Ticket deleted successfully"
- Error: Shows error message from server
- Confirmation: Dialog asks user to confirm before deletion

## Integration Notes

✅ Works with existing:
- Role-based access control system
- Authentication & authorization
- Toast notification system
- Form and ticket management flows

✅ Maintains:
- Consistent UI patterns
- Error handling standards
- Activity logging (deleted records)
- Frontend/backend synchronization

## API Endpoint Reference

**DELETE** `/service-tickets/:id`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Ticket deleted successfully"
}
```

**Error Responses:**
```json
// 403 Forbidden
{ "message": "You are not authorized to delete this ticket" }

// 400 Bad Request
{ "message": "Cannot delete ticket with status 'In Progress'. Only tickets with status 'Open' or 'Assigned' can be deleted." }

// 404 Not Found
{ "message": "Ticket not found" }
```

## Future Enhancements

- Add "Soft delete" option (mark as deleted instead of removing)
- Add bulk delete functionality
- Add delete reason/notes for audit trail
- Add undo functionality (with time limit)
- Add deletion to activity logs for tracking
