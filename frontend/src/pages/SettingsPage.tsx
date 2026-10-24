import React, { useState } from 'react';
import { Clock, Monitor, Moon, Sun, CheckCircle2, Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useConsent } from '../app/ConsentContext';

export const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [defaultPlatform, setDefaultPlatform] = useState('INSTAGRAM');
  const [reminderTime, setReminderTime] = useState('08:30');
  const [notifications, setNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);

  const { hasConsent, consent, connections, revokeConsent, setShowConsentModal } = useConsent();
  const connectedCount = connections.filter(c => c.status === 'CONNECTED').length;

  const handleRevokeConsent = async () => {
    if (!window.confirm('Revoking consent will disconnect all social accounts and disable posting. Continue?')) return;
    setConsentLoading(true);
    try {
      await revokeConsent();
    } finally {
      setConsentLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Settings</h1>
          <p className="text-sm text-muted">
            Configure application appearance, timezone rules, and notification preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance */}
        <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Monitor className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-charcoal">Appearance & Theme</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                theme === 'light'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-background text-charcoal hover:bg-surface'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-background text-charcoal hover:bg-surface'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3.5 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                theme === 'system'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-background text-charcoal hover:bg-surface'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-xs">System Default</span>
            </button>
          </div>
        </div>

        {/* Business Timezone & Daily Post Rules */}
        <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-charcoal">Daily Scheduling & Timezone</h2>
          </div>
          <p className="text-xs text-muted">
            The "one quality post per day" slot is calculated using your local business timezone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">Business Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="UTC">UTC Universal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">Default Social Platform</label>
              <select
                value={defaultPlatform}
                onChange={e => setDefaultPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="X">X (Twitter)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">Daily Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5 flex items-center justify-between pt-6">
              <div>
                <span className="text-xs font-medium text-charcoal block">Email & Push Reminders</span>
                <span className="text-[11px] text-muted block">Remind me to review today's post</span>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
                className="w-4 h-4 text-accent rounded border-border focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Posting Consent & Privacy */}
        <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-charcoal">Posting Consent &amp; Privacy</h2>
          </div>

          <div
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{
              background: hasConsent ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
              border: hasConsent ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {hasConsent ? (
              <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
            ) : (
              <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
            )}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold" style={{ color: hasConsent ? '#059669' : '#d97706' }}>
                {hasConsent ? 'Consent given' : 'No consent on file'}
              </p>
              {hasConsent && consent ? (
                <>
                  <p className="text-xs text-muted">
                    Agreed on {new Date(consent.agreedAt).toLocaleDateString(undefined, { dateStyle: 'long' })} · Version {consent.consentVersion}
                  </p>
                  <p className="text-xs text-muted">{connectedCount} social account(s) currently connected.</p>
                </>
              ) : (
                <p className="text-xs text-muted">
                  You haven't given consent yet. Posting and account connection features are locked until you accept.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasConsent ? (
              <button
                id="revoke-consent-btn"
                type="button"
                onClick={handleRevokeConsent}
                disabled={consentLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                {consentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Revoke Consent
              </button>
            ) : (
              <button
                id="give-consent-btn"
                type="button"
                onClick={() => setShowConsentModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                Review &amp; Accept Consent
              </button>
            )}
            <a
              href="/connect"
              className="px-4 py-2 rounded-lg text-sm font-medium text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
            >
              Manage Connected Accounts
            </a>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-published-text">
              <CheckCircle2 className="w-4 h-4" /> Preferences updated successfully
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
