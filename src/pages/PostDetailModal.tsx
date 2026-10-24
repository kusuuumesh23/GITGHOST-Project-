import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export const PostDetailModal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/posts');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4"
    >
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-modal p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 id="post-detail-title" className="text-lg font-semibold text-charcoal">
            Post Details: {id}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-muted hover:text-charcoal hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted">
          Placeholder for Phase 4 (full caption, image, status, metrics panel, editing).
        </p>
        <div className="flex justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
