import { state } from './state.js';
import { ALL_NAV } from './constants.js';

export function navItemsForRole(role) {
  const keys = {
    submitter: ['dashboard', 'submissions', 'upload', 'documents', 'security'],
    reviewer:  ['dashboard', 'review', 'documents', 'audit', 'security'],
    admin:     ALL_NAV.map(([r]) => r)
  }[role] || ALL_NAV.map(([r]) => r);
  return ALL_NAV.filter(([r]) => keys.includes(r));
}

export function visibleDocuments() {
  return state.documents.filter((doc) => {
    const haystack = `${doc.title} ${doc.category} ${doc.department} ${doc.owner?.name || ''} ${doc.reviewer?.name || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(state.search.trim().toLowerCase());
    const matchesStatus = state.status === 'all' || doc.status === state.status;
    return matchesSearch && matchesStatus;
  });
}

export function selectedFrom(docs) {
  return docs.find((doc) => doc.id === state.selectedDocumentId) || docs[0] || null;
}

export function countStatus(status) {
  return state.documents.filter((doc) => doc.status === status).length;
}

export function canSubmit(doc) {
  return doc && ['draft', 'changes_requested'].includes(doc.status) && (doc.ownerId === state.user?.id || state.user?.role === 'admin');
}

export function canReview(doc) {
  return doc && doc.status === 'pending' && (state.user?.role === 'admin' || doc.assignedTo === state.user?.id);
}
