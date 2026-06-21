import { icon } from '../icons.js';
import { escapeHtml } from '../utils.js';
import { state } from '../state.js';
import { sectionTitle } from './shell.js';

export function uploadPage() {
  const steps = [
    { label: 'Attach file', done: false, active: true },
    { label: 'Add details', done: false, active: false },
    { label: 'Assign reviewer', done: false, active: false },
    { label: 'Submit', done: false, active: false }
  ];
  return `
    ${sectionTitle('Upload document', 'Attach a file, fill in details, assign a reviewer, then save as draft or submit immediately.')}
    <div class="upload-card">
      <div class="upload-steps">
        ${steps.map((s, i) => `
          <div class="upload-step ${s.active ? 'active' : ''} ${s.done ? 'done' : ''}">
            <span class="upload-step-num">${i + 1}</span>
            <span>${s.label}</span>
          </div>
          ${i < steps.length - 1 ? '<div class="upload-step-connector"></div>' : ''}
        `).join('')}
      </div>
      <form id="uploadForm" class="form-stack">
        <div class="upload-grid">
          <div class="field">
            <label>Document title</label>
            <input name="title" placeholder="e.g. Vendor Agreement - June 2026" required />
          </div>
          <div class="field">
            <label>Category</label>
            <select name="category">
              <option>Contract</option>
              <option>Invoice</option>
              <option>Policy</option>
              <option>HR Form</option>
              <option>Certificate</option>
              <option>General</option>
            </select>
          </div>
          <div class="field">
            <label>Department</label>
            <input name="department" value="${escapeHtml(state.user?.department || 'Operations')}" required />
          </div>
          <div class="field">
            <label>Confidentiality</label>
            <select name="confidentiality">
              <option>Internal</option>
              <option>Confidential</option>
              <option>Restricted</option>
            </select>
          </div>
          <div class="field">
            <label>Reviewer</label>
            <select name="assignedTo">
              ${state.reviewers.map((reviewer) => `<option value="${reviewer.id}">${escapeHtml(reviewer.name)} — ${escapeHtml(reviewer.roleName)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Due date</label>
            <input name="dueDate" type="date" />
          </div>
        </div>

        <label class="dropzone" id="dropzone">
          <div class="dz-ic">${icon('upload')}</div>
          <strong>Drag and drop, or click to attach a file</strong>
          <div class="dz-hint">PDF, Word, Excel, PNG, JPG or TXT · 10 MB max · extension, MIME and signature checked</div>
          <div class="dz-file">${icon('check-circle')}<span id="dzFileName"></span></div>
          <input name="file" type="file" id="fileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" required />
        </label>

        <div class="field">
          <label>Submission notes</label>
          <textarea name="notes" placeholder="Explain what the reviewer should check..."></textarea>
        </div>
        <div class="btn-row">
          <label class="toggle-row"><input type="checkbox" name="submitNow" value="true" /> Submit immediately after upload</label>
          <button class="btn primary" type="submit">${icon('upload')}Upload document</button>
          <button class="btn ghost" type="reset">Reset</button>
        </div>
      </form>
    </div>
  `;
}
