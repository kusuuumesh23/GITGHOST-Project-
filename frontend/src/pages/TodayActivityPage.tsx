import React from 'react';
import { CheckCircle2, Clock, Bot } from 'lucide-react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PostStatus = 'published' | 'scheduled';

interface ActivityPost {
  id: string;
  platform: string;
  caption: string;
  scheduledAt: string;
  status: PostStatus;
}

// ---------------------------------------------------------------------------
// Posts — populated by the real API when connected (VITE_DATA_SOURCE=api)
// ---------------------------------------------------------------------------

const POSTS: ActivityPost[] = [];

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  published: {
    label: 'Published',
    icon: CheckCircle2,
    className:
      'text-status-published-text bg-status-published-bg border-status-published-border',
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className:
      'text-status-ready-text bg-status-ready-bg border-status-ready-border',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: PostStatus }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium',
        className
      )}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActivityRow({ post }: { post: ActivityPost }) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-border last:border-b-0">
      {/* Time column */}
      <div className="shrink-0 w-16 text-xs text-muted font-medium tabular-nums pt-0.5">
        {formatTime(post.scheduledAt)}
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-charcoal bg-background border border-border px-2 py-0.5 rounded">
            {post.platform}
          </span>
          <StatusBadge status={post.status} />
        </div>
        <p className="text-sm text-charcoal leading-relaxed line-clamp-2">
          {post.caption}
        </p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

function SummaryBar({ posts }: { posts: ActivityPost[] }) {
  const counts: Record<PostStatus, number> = { published: 0, scheduled: 0 };
  posts.forEach(p => { counts[p.status] += 1; });

  const stats: { label: string; status: PostStatus }[] = [
    { label: 'Published', status: 'published' },
    { label: 'Scheduled', status: 'scheduled' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3" aria-label="Activity summary">
      {stats.map(({ label, status }) => {
        const { icon: Icon, className } = STATUS_CONFIG[status];
        return (
          <div
            key={label}
            className={clsx(
              'flex flex-col items-center justify-center p-3 rounded-lg border text-center',
              className
            )}
          >
            <Icon className="w-4 h-4 mb-1" aria-hidden="true" />
            <span className="text-xl font-semibold leading-none">{counts[status]}</span>
            <span className="text-xs mt-1 opacity-80">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TodayActivityPage: React.FC = () => {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal flex items-center gap-2">
            <Bot className="w-6 h-6 text-accent shrink-0" aria-hidden="true" />
            Today&apos;s AI Activity
          </h1>
          <p className="text-sm text-muted mt-1">{today}</p>
        </div>
      </div>

      {/* Summary bar */}
      <section aria-labelledby="activity-summary-heading">
        <h2
          id="activity-summary-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted mb-3"
        >
          Summary
        </h2>
        <SummaryBar posts={POSTS} />
      </section>

      {/* Activity feed */}
      <section aria-labelledby="activity-feed-heading">
        <h2
          id="activity-feed-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted mb-3"
        >
          Post Activity
        </h2>
        <div className="bg-surface border border-border rounded-lg shadow-subtle px-4">
          {POSTS.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No AI activity scheduled for today.
            </p>
          ) : (
            <ul aria-label="Today's AI post activity">
              {POSTS.map(post => (
                <ActivityRow key={post.id} post={post} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Explanatory note */}
      <p className="text-xs text-muted">
        Posts are created and published automatically by the AI based on your
        30-day campaign settings. Visit{' '}
        <strong className="text-charcoal font-medium">All Posts</strong> for
        the full history.
      </p>
    </div>
  );
};

export default TodayActivityPage;
