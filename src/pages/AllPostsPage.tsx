import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AllPostsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">All Posts</h1>
          <p className="text-sm text-muted">Complete historical archive of your daily posts</p>
        </div>
      </div>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-subtle space-y-3">
        <p className="text-charcoal font-medium">Post History Archive</p>
        <p className="text-sm text-muted">
          Placeholder for Phase 3 (filters, search, sort, grid/list view).
        </p>
        <div className="pt-2">
          <Link
            to="/posts/demo-post-1"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-accent-soft text-accent hover:bg-accent hover:text-white transition-colors"
          >
            Preview Post Detail Modal (/posts/demo-post-1)
          </Link>
        </div>
      </div>

      {/* Outlet renders PostDetailModal when URL is /posts/:id */}
      <Outlet />
    </div>
  );
};

export default AllPostsPage;
