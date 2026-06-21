export const state = {
  token: localStorage.getItem('sda_token') || '',
  user: null,
  documents: [],
  audit: [],
  reviewers: [],
  stats: null,
  session: null,
  route: localStorage.getItem('sda_route') || 'dashboard',
  search: '',
  status: 'all',
  auditFilters: {
    action: 'all',
    user: 'all',
    document: 'all',
    status: 'all'
  },
  selectedDocumentId: null,
  loading: true,
  mobileNavOpen: false,
  decisionModal: null
};
