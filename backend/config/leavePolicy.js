// Default annual leave allocation per leave type for an IT company
export const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Other',
];

export const LEAVE_POLICY = {
  'Sick Leave':      { perYear: 10 },
  'Casual Leave':    { perYear: 10 },
  'Earned Leave':    { perYear: 15 },
  'Maternity Leave': { perYear: 90 },
  'Paternity Leave': { perYear: 5  },
  'Other':           { perYear: 5  },
};
