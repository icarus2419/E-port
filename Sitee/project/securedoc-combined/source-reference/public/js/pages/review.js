import { state } from '../state.js';
import { selectedFrom } from '../helpers.js';
import { empty } from '../utils.js';
import { sectionTitle } from './shell.js';
import { documentCard, documentDetail } from './documents.js';

export function reviewPage() {
  const canAccess = ['reviewer', 'admin'].includes(state.user?.role);
  const queue = state.documents.filter((doc) => doc.status === 'pending' && (state.user?.role === 'admin' || doc.assignedTo === state.user?.id));
  const doc = selectedFrom(queue);

  if (!canAccess) {
    return `
      ${sectionTitle('Review queue', 'Approval decisions are restricted to reviewers and admins.')}
      <div class="panel">
        ${empty('Your current role (Submitter) can upload documents, track their status, and respond to change requests — but cannot approve, reject, or request changes. Switch to a Reviewer or Admin account to access this area.', 'Restricted area')}
      </div>
    `;
  }

  return `
    ${sectionTitle('Review queue', `${queue.length} pending submission${queue.length === 1 ? '' : 's'} assigned to you. Inspect the fingerprint and hash before recording your decision.`)}
    <div class="detail-layout">
      <div class="doc-grid">
        ${queue.length
          ? queue.map((item) => documentCard(item, doc?.id === item.id)).join('')
          : empty('No pending documents are currently assigned to you. Documents submitted for review will appear here.', 'All clear')}
      </div>
      <aside class="panel detail-panel">
        ${doc
          ? documentDetail(doc)
          : empty('Select a document from the list to review its details, fingerprint and approval history before making a decision.', 'Select a document')}
      </aside>
    </div>
  `;
}
