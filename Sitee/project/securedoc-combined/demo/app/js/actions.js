import { state } from './state.js';
import { api } from './api.js';
import { toast } from './utils.js';
import { refresh } from './auth.js';

export async function submitDocument(docId) {
  try {
    await api(`/api/documents/${docId}/submit`, { method: 'PATCH' });
    await refresh('Document submitted for approval.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

export async function addComment(docId, body) {
  try {
    await api(`/api/documents/${docId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
    await refresh('Comment added.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

export async function decideDocument(docId, decision, note) {
  try {
    await api(`/api/documents/${docId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, note })
    });
    state.decisionModal = null;
    const label = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent back for changes';
    await refresh(`Document ${label}.`);
  } catch (error) {
    toast(error.message, 'error');
  }
}

export async function uploadDocument(form) {
  const data = new FormData(form);
  if (!data.get('file') || !data.get('file').name) {
    toast('Attach a document file first.', 'error');
    return;
  }
  try {
    await api('/api/documents', { method: 'POST', body: data });
    form.reset();
    state.route = 'documents';
    await refresh('Document uploaded successfully.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

export async function uploadDocumentVersion(form, docId) {
  const data = new FormData(form);
  if (!data.get('file') || !data.get('file').name) {
    toast('Attach a revised document file first.', 'error');
    return;
  }
  try {
    await api(`/api/documents/${docId}/versions`, { method: 'POST', body: data });
    form.reset();
    await refresh('New document version uploaded.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

export async function downloadDocument(doc) {
  try {
    const response = await fetch(`/api/documents/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Could not download this file.' }));
      throw new Error(payload.error || 'Could not download this file.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || 'document';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast(error.message, 'error');
  }
}
