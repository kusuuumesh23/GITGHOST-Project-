import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Settings</h1>
          <p className="text-sm text-muted">Account preferences, appearance, and notifications</p>
        </div>
      </div>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-subtle">
        <p className="text-charcoal font-medium">Platform Preferences</p>
        <p className="text-sm text-muted mt-1">
          Placeholder for Phase 8 (account info, theme toggle, notification preferences).
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
