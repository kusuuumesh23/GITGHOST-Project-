import React from 'react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Business Profile</h1>
          <p className="text-sm text-muted">Manage target audience, tone, and brand details</p>
        </div>
      </div>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-subtle">
        <p className="text-charcoal font-medium">Business Information</p>
        <p className="text-sm text-muted mt-1">
          Placeholder for Phase 8 (profile form, marketing goals, platforms).
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
