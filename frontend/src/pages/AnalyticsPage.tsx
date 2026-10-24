import React, { useState } from 'react';
import { useBusiness } from '../hooks/useBusiness';
import { useAnalytics } from '../hooks/useAnalytics';
import { Heart, MessageSquare, Share2, Eye, MousePointer, Info, BarChart3, AlertCircle } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const [dateRange, setDateRange] = useState<'all' | '30d' | '7d'>('all');

  const { analytics, isLoading, error } = useAnalytics(activeBusinessId);

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Analytics & Insights</h1>
          <p className="text-sm text-muted">
            Honest performance records for {activeBusiness?.name || 'your business'}. We never invent metrics.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === '7d' ? 'bg-accent text-white font-semibold' : 'text-muted hover:text-charcoal'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === '30d' ? 'bg-accent text-white font-semibold' : 'text-muted hover:text-charcoal'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              dateRange === 'all' ? 'bg-accent text-white font-semibold' : 'text-muted hover:text-charcoal'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Honest Data Notice Banner */}
      <div className="p-4 bg-surface border border-border rounded-xl shadow-subtle flex items-start gap-3">
        <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="text-xs text-charcoal space-y-1">
          <p className="font-semibold text-accent">Data Honesty Policy</p>
          <p className="text-muted leading-relaxed">
            {analytics?.dataAvailability.notice ||
              'Missing metrics are shown as "Not recorded". We never fabricate likes, reach, or engagement rates.'}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-surface rounded-xl border border-border" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-status-failed-bg text-status-failed-text rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error.message || 'Failed to load analytics data'}</span>
        </div>
      )}

      {/* Totals Metric Cards */}
      {analytics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Likes */}
            <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-xs text-muted font-medium">
                <span>Total Likes</span>
                <Heart className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {analytics.totals.likes !== null ? analytics.totals.likes.toLocaleString() : 'Not recorded'}
              </div>
              <p className="text-[11px] text-muted">
                {analytics.totals.contributingPostCount > 0
                  ? `Across ${analytics.totals.contributingPostCount} recorded post(s)`
                  : 'No observations recorded'}
              </p>
            </div>

            {/* Comments */}
            <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-xs text-muted font-medium">
                <span>Total Comments</span>
                <MessageSquare className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {analytics.totals.comments !== null ? analytics.totals.comments.toLocaleString() : 'Not recorded'}
              </div>
              <p className="text-[11px] text-muted">
                {analytics.totals.contributingPostCount > 0
                  ? `Across ${analytics.totals.contributingPostCount} recorded post(s)`
                  : 'No observations recorded'}
              </p>
            </div>

            {/* Shares */}
            <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-xs text-muted font-medium">
                <span>Total Shares</span>
                <Share2 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {analytics.totals.shares !== null ? analytics.totals.shares.toLocaleString() : 'Not recorded'}
              </div>
              <p className="text-[11px] text-muted">
                {analytics.totals.shares !== null
                  ? `From active posts`
                  : 'Awaiting sync integration'}
              </p>
            </div>

            {/* Reach */}
            <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-xs text-muted font-medium">
                <span>Estimated Reach</span>
                <Eye className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {analytics.totals.reach !== null ? analytics.totals.reach.toLocaleString() : 'Not recorded'}
              </div>
              <p className="text-[11px] text-muted">
                {analytics.totals.reach !== null ? 'Verified impressions' : 'Requires platform API connection'}
              </p>
            </div>

            {/* Clicks */}
            <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-xs text-muted font-medium">
                <span>Link Clicks</span>
                <MousePointer className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-charcoal">
                {analytics.totals.clicks !== null ? analytics.totals.clicks.toLocaleString() : 'Not recorded'}
              </div>
              <p className="text-[11px] text-muted">
                {analytics.totals.clicks !== null ? 'Direct link clicks' : 'Requires platform API connection'}
              </p>
            </div>
          </div>

          {/* Platform Performance & Top Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Comparison */}
            <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <BarChart3 className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold text-charcoal">Platform Observations</h2>
              </div>

              {Object.keys(analytics.metricsByPlatform).length === 0 ? (
                <p className="text-xs text-muted">No posts available for platform comparison.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.metricsByPlatform).map(([plat, stats]) => (
                    <div
                      key={plat}
                      className="p-3 bg-background border border-border rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-charcoal">{plat}</span>
                        <p className="text-muted">{stats.postCount} post(s) created</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-charcoal">
                          {stats.likes !== null ? `${stats.likes} likes` : 'Likes unrecorded'}
                        </span>
                        <p className="text-muted">
                          {stats.comments !== null ? `${stats.comments} comments` : 'Comments unrecorded'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performing Posts */}
            <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
              <h2 className="text-base font-semibold text-charcoal pb-2 border-b border-border">
                Top Performing Posts (Recorded Engagement)
              </h2>

              {analytics.topPerformingPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted space-y-1">
                  <p>No posts with recorded engagement metrics yet.</p>
                  <p className="opacity-80">Metrics will appear once verified by real social platform integrations.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.topPerformingPosts.map((post, i) => (
                    <div
                      key={post.id}
                      className="p-3 bg-background border border-border rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="font-semibold text-charcoal line-clamp-1">
                          #{i + 1} {post.title}
                        </span>
                        <p className="text-muted text-[11px]">{post.platform}</p>
                      </div>
                      <span className="font-bold text-accent px-2 py-1 rounded bg-accent/10">
                        {post.recordedEngagement} engagements
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
