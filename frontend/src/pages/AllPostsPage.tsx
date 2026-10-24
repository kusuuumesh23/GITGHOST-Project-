import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useBusiness } from '../hooks/useBusiness';
import { usePosts } from '../hooks/usePosts';
import { Search, Filter, Layers, Clock, CheckCircle2, Archive, MessageSquare, Heart } from 'lucide-react';
import { PostStatus } from '../types/index.js';

export const AllPostsPage: React.FC = () => {
  const { activeBusinessId } = useBusiness();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | undefined>(undefined);

  const { posts, total, isLoading } = usePosts(activeBusinessId, {
    search: search || undefined,
    status: statusFilter,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">All Posts</h1>
          <p className="text-sm text-muted">
            Permanent historical archive of all generated daily marketing posts ({total} total)
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors self-start sm:self-auto shadow-subtle"
        >
          Generate Today's Post
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by caption, headline, or hashtags..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select
            value={statusFilter || ''}
            onChange={e => setStatusFilter(e.target.value ? (e.target.value as PostStatus) : undefined)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && posts.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-surface rounded-xl border border-border" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <div className="p-12 bg-surface border border-dashed border-border rounded-xl text-center space-y-3">
          <Layers className="w-8 h-8 text-muted mx-auto" />
          <h3 className="text-base font-semibold text-charcoal">No posts found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {search || statusFilter
              ? 'No posts matched your current search or filter criteria.'
              : 'You have not created any posts yet. Start by generating your daily post!'}
          </p>
        </div>
      )}

      {/* Post Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => {
          const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="group bg-surface border border-border rounded-xl shadow-subtle hover:shadow-card hover:border-accent/40 transition-all flex flex-col overflow-hidden"
            >
              {/* Image banner or placeholder */}
              <div className="h-44 bg-accent/5 border-b border-border flex items-center justify-center relative overflow-hidden">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-accent tracking-wider">
                      {post.platform}
                    </span>
                    <p className="text-xs text-muted line-clamp-2 px-2 italic">
                      "{post.imagePrompt || post.title}"
                    </p>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                      post.status === 'published'
                        ? 'bg-status-published-bg text-status-published-text border border-status-published-border'
                        : post.status === 'archived'
                        ? 'bg-status-failed-bg text-status-failed-text'
                        : 'bg-surface/90 text-charcoal border border-border'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted font-medium">
                    <span>{formattedDate}</span>
                    <span>{post.contentGoal.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-charcoal group-hover:text-accent transition-colors line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-charcoal/80 line-clamp-3 leading-relaxed">
                    {post.caption}
                  </p>
                </div>

                {/* Metrics Footer (Honest Data) */}
                <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1" title="Recorded Likes">
                      <Heart className="w-3.5 h-3.5 text-muted" />
                      {post.metrics?.likes !== null && post.metrics?.likes !== undefined
                        ? post.metrics.likes
                        : '—'}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Recorded Comments">
                      <MessageSquare className="w-3.5 h-3.5 text-muted" />
                      {post.metrics?.comments !== null && post.metrics?.comments !== undefined
                        ? post.metrics.comments
                        : '—'}
                    </span>
                  </div>
                  <span className="text-[11px] text-accent font-medium group-hover:underline">
                    View Post &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Detail Modal Outlet */}
      <Outlet />
    </div>
  );
};

export default AllPostsPage;
