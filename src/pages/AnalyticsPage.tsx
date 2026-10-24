import React from 'react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Analytics</h1>
          <p className="text-sm text-muted">Performance insights from recorded post metrics</p>
        </div>
      </div>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-subtle">
        <p className="text-charcoal font-medium">Performance Trends</p>
        <p className="text-sm text-muted mt-1">
          Placeholder for Phase 7 (Recharts engagement trend, platform breakdown, summaries).
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
