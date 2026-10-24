import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../hooks/useBusiness';
import { usePosts } from '../hooks/usePosts';
import { useAnalytics } from '../hooks/useAnalytics';
import { Sparkles, Calendar, Layers, ArrowRight, Heart, MessageSquare, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const { posts, total, isLoading: isPostsLoading } = usePosts(activeBusinessId, { pageSize: 4 });
  const { analytics } = useAnalytics(activeBusinessId);

  // Check if today's post exists
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPost = posts.find(p => p.createdAt?.startsWith(todayStr));

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">
            Welcome, {activeBusiness?.name || 'Business Owner'}
          </h1>
          <p className="text-sm text-muted">
            Daily marketing command center for {activeBusiness?.industry || 'your business'}
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors shadow-subtle self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Generate Today's Post
        </Link>
      </div>

      {/* Today's Post Spotlight */}
      <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-charcoal">Today's Daily Marketing Post</h2>
          </div>
          {todayPost ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-published-bg text-status-published-text border border-status-published-border">
              <CheckCircle2 className="w-3.5 h-3.5" /> Generated for Today
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
              Pending Today's Generation
            </span>
          )}
        </div>

        {todayPost ? (
          <div className="bg-background border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal">{todayPost.title}</h3>
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-surface border border-border text-muted font-semibold">
                {todayPost.platform}
              </span>
            </div>
            <p className="text-sm text-charcoal/90 line-clamp-2 leading-relaxed">
              {todayPost.caption}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-accent font-medium">{todayPost.callToAction}</span>
              <Link
                to={`/posts/${todayPost.id}`}
                className="inline-flex items-center gap-1 text-accent font-semibold hover:underline"
              >
                Review & Edit Details &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted max-w-md mx-auto">
              You haven't generated your one high-quality post for today yet. It takes less than 30 seconds to generate and review!
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Post Now
            </Link>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Historical Archive</span>
          <div className="text-2xl font-bold text-charcoal">{total}</div>
          <p className="text-xs text-muted">Total posts preserved in history</p>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Verified Engagements</span>
          <div className="text-2xl font-bold text-charcoal">
            {analytics?.totals.likes !== null && analytics?.totals.likes !== undefined
              ? (analytics.totals.likes + (analytics.totals.comments || 0)).toLocaleString()
              : 'Not recorded'}
          </div>
          <p className="text-xs text-muted">Real observations only (no fake stats)</p>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Website Context</span>
          <div className="text-2xl font-bold text-accent">
            {activeBusiness?.websiteUrl ? 'Connected' : 'Unconnected'}
          </div>
          <Link to="/profile" className="text-xs text-accent hover:underline inline-block">
            {activeBusiness?.websiteUrl ? 'View crawled context →' : 'Set up TinyFish crawl →'}
          </Link>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-charcoal">Recent Posts</h2>
          </div>
          <Link
            to="/posts"
            className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline"
          >
            View All ({total}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isPostsLoading && posts.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-background rounded-lg border border-border" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No posts in your history yet.</p>
        ) : (
          <div className="space-y-2.5">
            {posts.slice(0, 4).map(post => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="p-3.5 bg-background border border-border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-accent/40 transition-colors group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                      {post.platform}
                    </span>
                    <h4 className="text-xs font-bold text-charcoal group-hover:text-accent transition-colors">
                      {post.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted line-clamp-1">{post.caption}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {post.metrics?.likes !== null ? post.metrics.likes : '—'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.metrics?.comments !== null ? post.metrics.comments : '—'}
                  </span>
                  <span className="text-[11px] text-muted">
                    {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
