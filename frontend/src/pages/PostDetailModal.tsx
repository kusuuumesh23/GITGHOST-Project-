import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePost } from '../hooks/usePost';
import { X, Heart, MessageSquare, Share2, Eye, MousePointer, Archive, RotateCcw, Check, Tag, Lock, ShieldCheck } from 'lucide-react';
import { useConsent } from '../app/ConsentContext';

export const PostDetailModal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { post, isLoading, error, update, archive, restore } = usePost(id);
  const { hasConsent, setShowConsentModal } = useConsent();

  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState('');
  const [callToAction, setCallToAction] = useState('');

  useEffect(() => {
    if (post) {
      setCaption(post.caption);
      setCallToAction(post.callToAction);
    }
  }, [post]);

  const handleClose = () => {
    navigate('/posts');
  };

  const handleSave = async () => {
    await update({ caption, callToAction });
    setIsEditing(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-modal p-6 space-y-5 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">
              {post?.platform || 'INSTAGRAM'}
            </span>
            <span className="text-xs text-muted font-medium">
              Status: <span className="font-semibold text-charcoal">{post?.status || 'draft'}</span>
            </span>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted hover:text-charcoal hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading && (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-background rounded w-1/3"></div>
            <div className="h-24 bg-background rounded"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-status-failed-bg text-status-failed-text rounded-lg text-sm">
            {error.message || 'Failed to load post details'}
          </div>
        )}

        {post && (
          <div className="space-y-4">
            <h2 id="post-detail-title" className="text-lg font-bold text-charcoal">
              {post.title}
            </h2>

            {/* Editable Caption */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Post Caption
                </label>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-muted hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <textarea
                  rows={4}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full p-3 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed"
                />
              ) : (
                <div className="p-4 bg-background border border-border rounded-lg text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
                  {post.caption}
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Call to Action
              </span>
              <p className="text-sm font-medium text-accent bg-accent/5 p-2.5 rounded-lg border border-accent/15">
                {post.callToAction}
              </p>
            </div>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Hashtags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {post.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-md bg-background border border-border text-charcoal font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Honest Metrics Panel */}
            <div className="pt-3 border-t border-border space-y-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Recorded Performance (Data Honesty)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className="p-2.5 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                    <Heart className="w-3.5 h-3.5" /> Likes
                  </div>
                  <span className="text-sm font-bold text-charcoal">
                    {post.metrics?.likes !== null && post.metrics?.likes !== undefined
                      ? post.metrics.likes
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-2.5 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Comments
                  </div>
                  <span className="text-sm font-bold text-charcoal">
                    {post.metrics?.comments !== null && post.metrics?.comments !== undefined
                      ? post.metrics.comments
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-2.5 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                    <Share2 className="w-3.5 h-3.5" /> Shares
                  </div>
                  <span className="text-sm font-bold text-charcoal">
                    {post.metrics?.shares !== null && post.metrics?.shares !== undefined
                      ? post.metrics.shares
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-2.5 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                    <Eye className="w-3.5 h-3.5" /> Reach
                  </div>
                  <span className="text-sm font-bold text-charcoal">
                    {post.metrics?.reach !== null && post.metrics?.reach !== undefined
                      ? post.metrics.reach
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="p-2.5 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                    <MousePointer className="w-3.5 h-3.5" /> Clicks
                  </div>
                  <span className="text-sm font-bold text-charcoal">
                    {post.metrics?.clicks !== null && post.metrics?.clicks !== undefined
                      ? post.metrics.clicks
                      : 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {post.status !== 'archived' ? (
                <button
                  onClick={archive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-charcoal hover:bg-background transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive Post
                </button>
              ) : (
                <button
                  onClick={restore}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-accent hover:bg-accent/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore Post
                </button>
              )}

              {/* Approve gate */}
              {post.status === 'draft' && (
                hasConsent ? (
                  <button
                    id="modal-approve-post-btn"
                    onClick={() => update({ status: 'approved' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approve &amp; Schedule
                  </button>
                ) : (
                  <button
                    id="modal-consent-needed-btn"
                    onClick={() => setShowConsentModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                    style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#d97706', background: 'rgba(245,158,11,0.08)' }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Consent required
                  </button>
                )
              )}

              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailModal;
