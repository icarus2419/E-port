import { icon } from '../icons.js';
import { escapeHtml } from '../utils.js';
import { DEMO_ACCOUNTS } from '../constants.js';

export function loginPage() {
  return `
    <div class="signin-screen">
      <header class="signin-topbar">
        <a href="/" class="hero-brand" aria-label="SecureDoc home">
          <div class="brand-logo">${icon('shield')}</div>
          <span class="brand-name">Secure<b>Doc</b></span>
        </a>
        <a href="/" class="btn ghost small">${icon('arrow-left')}Back to site</a>
      </header>

      <main class="signin-main">
        <div class="signin-screen-glow" aria-hidden="true"></div>
        <div class="signin-centered-wrap">
          <div class="signin-screen-head">
            <span class="eyebrow">${icon('shield')}Interactive demo</span>
            <h1 class="signin-screen-title">Pick a role.<br><span class="hero-grad">Explore instantly.</span></h1>
            <p class="signin-screen-sub">Three accounts with different permissions — no setup, no credit card.</p>
          </div>

          <aside class="signin-card signin-card-centered" aria-label="Choose a demo role">
            <p class="signin-sub">All accounts use password <code class="demo-pw">demo123</code></p>
            <div class="role-list">
              ${DEMO_ACCOUNTS.map((account) => `
                <button class="role-card ${account.color}" data-login-email="${account.email}" data-login-password="${account.password}">
                  <span class="role-ic">${icon(account.icon)}</span>
                  <span class="role-body">
                    <strong>${escapeHtml(account.label)}</strong>
                    <span class="role-desc-line">${escapeHtml(account.role)}</span>
                    <span class="role-email">${escapeHtml(account.email)}</span>
                  </span>
                  <span class="role-arrow">${icon('arrow-right')}</span>
                </button>
              `).join('')}
            </div>
            <div class="signin-note">
              ${icon('lock')}
              <span>Demo accounts — fictional data only. Sessions expire after 2 hours. Every login is recorded in the audit trail.</span>
            </div>
          </aside>
        </div>
      </main>

      <footer class="signin-footer">
        <p>© 2025 SecureDoc · Demo environment · <span class="hdr-demo"><span class="dot"></span>Interactive demo</span></p>
      </footer>
    </div>
  `;
}
