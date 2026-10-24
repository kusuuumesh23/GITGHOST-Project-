import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
          <p className="text-sm text-muted">Daily marketing overview and performance metrics</p>
        </div>
      </div>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-subtle">
        <p className="text-charcoal font-medium">Today's Daily Post</p>
        <p className="text-sm text-muted mt-1">
          Placeholder for Phase 6 (Dashboard status, recent posts, metrics).
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
