export const STATUS_ORDER = ['draft', 'pending', 'changes_requested', 'approved', 'rejected'];

export const ACTION_LABELS = {
  login: 'Login',
  logout: 'Logout',
  upload: 'Document Uploaded',
  submit: 'Submitted for Review',
  uploaded_and_submitted: 'Uploaded & Submitted',
  submitted_document: 'Submitted for Review',
  approve: 'Document Approved',
  approved_document: 'Document Approved',
  reject: 'Document Rejected',
  rejected_document: 'Document Rejected',
  request_changes: 'Changes Requested',
  requested_changes: 'Changes Requested',
  comment: 'Comment Added',
  commented: 'Comment Added',
  download: 'Document Downloaded',
  version_upload: 'New Version Uploaded',
  assign_reviewer: 'Reviewer Assigned',
  failed_login: 'Failed Login Attempt',
  failed_permission: 'Access Denied'
};

export const STATUS_NAMES = {
  all: 'All',
  draft: 'Draft',
  pending: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected'
};

export const ALL_NAV = [
  ['dashboard',   'grid',      'Dashboard'],
  ['documents',   'folder',    'Documents'],
  ['submissions', 'file-text', 'My Submissions'],
  ['upload',      'upload',    'Upload'],
  ['review',      'check',     'Needs Review'],
  ['audit',       'clock',     'Audit Trail'],
  ['security',    'shield',    'Security']
];

export const DEMO_ACCOUNTS = [
  {
    label: 'Joseph Doyle-Samadi',
    role: 'Employee / Submitter',
    email: 'employee@demo.com',
    password: 'demo123',
    color: 'blue',
    icon: 'briefcase',
    description: 'Upload files, save drafts, submit documents and reply to change requests.'
  },
  {
    label: 'Maya Chen',
    role: 'Reviewer / Manager',
    email: 'reviewer@demo.com',
    password: 'demo123',
    color: 'violet',
    icon: 'check-circle',
    description: 'Open the approval queue, approve, reject, or request changes with notes.'
  },
  {
    label: 'Alex Morgan',
    role: 'System Admin',
    email: 'admin@demo.com',
    password: 'demo123',
    color: 'amber',
    icon: 'shield',
    description: 'See every document, audit event, reviewer assignment and security control.'
  }
];
