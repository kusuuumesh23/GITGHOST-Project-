import React from 'react';

export const CreatePostPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Create Today's Post</h1>
          <p className="text-sm text-muted">Generate and review your daily social media post</p>
        </div>
      </div>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-subtle">
        <p className="text-charcoal font-medium">Generation Workspace</p>
        <p className="text-sm text-muted mt-1">
          Placeholder for Phase 5 (generation controls, live preview, editor).
        </p>
      </div>
    </div>
  );
};

export default CreatePostPage;
