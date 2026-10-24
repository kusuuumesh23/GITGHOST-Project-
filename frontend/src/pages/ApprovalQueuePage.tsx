import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit3,
  Send,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Sparkles,
  Lock,
  Clock,
  Save,
  Check,
} from 'lucide-react';
import { services } from '../services';
import { Post, Platform } from '../types';
import { useConsent } from '../app/ConsentContext';
import { Link } from 'react-router-dom';

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  LINKEDIN: Linkedin,
  X: Twitter,
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
};

const PLATFORM_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  LINKEDIN: { bg: '#0A66C220', text: '#0A66C2', gradient: 'linear-gradient(135deg, #0A66C2, #0077B5)' },
  X: { bg: '#1DA1F220', text: '#1DA1F2', gradient: 'linear-gradient(135deg, #1DA1F2, #0d7fc0)' },
  INSTAGRAM: { bg: '#E1306C20', text: '#E1306C', gradient: 'linear-gradient(135deg, #f09433, #dc2743)' },
  FACEBOOK: { bg: '#1877F220', text: '#1877F2', gradient: 'linear-gradient(135deg, #1877F2, #0d5ecb)' },
};

export const ApprovalQueuePage: React.FC = () => {
  const { hasConsent, connections } = useConsent();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const activeBusinessId = 'demo-business-1';

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const queue = await services.posts.getApprovalQueue(activeBusinessId);
      setPosts(queue);
    } catch (err) {
      console.error('Failed to load approval queue:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // 1. Approve & Publish Immediately
  const handleApproveAndPost = async (post: Post) => {
    if (!hasConsent) {
      showToast('Consent required before posting to social accounts', 'error');
      return;
    }

    const platformKey = (post.platform || 'LINKEDIN').toUpperCase();
    const isConnected = connections.some(c => c.platform === platformKey && c.status === 'CONNECTED');
    if (!isConnected) {
      showToast(`Please connect your ${post.platform} account in Connect Accounts first`, 'error');
      return;
    }

    setActionLoading(prev => ({ ...prev, [post.id]: 'publishing' }));
    try {
      // First approve the post
      await services.posts.approve(post.id);
      // Then publish to live platform API
      const result = await services.posts.publish(post.id);
      showToast(`Successfully published to ${post.platform}!`);
      // Remove from approval queue
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (err: any) {
      showToast(err.message || 'Failed to publish post', 'error');
      // Update local post to failed status
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, status: 'failed', failureReason: err.message || 'Publishing error' }
            : p
        )
      );
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[post.id];
        return next;
      });
    }
  };

  // 2. Approve Only (Move to Approved / Scheduled)
  const handleApproveOnly = async (postId: string) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'approving' }));
    try {
      await services.posts.approve(postId);
      showToast('Post approved and queued for publishing');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      showToast(err.message || 'Failed to approve post', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  // 3. Edit Caption
  const startEditing = (post: Post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption);
  };

  const handleSaveEdit = async (postId: string) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'saving' }));
    try {
      const updated = await services.posts.update(postId, { caption: editCaption });
      setPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
      setEditingPostId(null);
      showToast('Caption updated successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to update caption', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  // 4. Regenerate Caption
  const handleRegenerate = async (postId: string) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'regenerating' }));
    try {
      const updated = await services.generation.regenerateCaption(postId);
      setPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
      showToast('New AI caption generated!');
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate caption', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  // 5. Reject Post
  const handleReject = async (postId: string) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'rejecting' }));
    try {
      await services.posts.reject(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post rejected and archived');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject post', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  // 6. Retry Failed Post
  const handleRetry = async (post: Post) => {
    handleApproveAndPost(post);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium transition-all animate-bounce"
          style={{
            background: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
            color: '#fff',
            border: `1px solid ${actionMessage.type === 'success' ? '#10b981' : '#f87171'}`,
          }}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-charcoal">Approval Queue</h1>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: posts.length > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.1)',
                color: posts.length > 0 ? '#6366f1' : '#64748b',
              }}
            >
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} awaiting review
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Review every AI-generated post before it gets published. Nothing goes live without your explicit approval.
          </p>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors self-start sm:self-auto hover:bg-surface"
          style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Consent Warning Banner */}
      {!hasConsent && (
        <div
          className="flex items-start gap-3.5 rounded-xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
            borderColor: 'rgba(245,158,11,0.3)',
          }}
        >
          <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">Posting is currently locked</h4>
            <p className="text-xs text-amber-700/90 mt-0.5">
              You must accept the posting consent agreement before approved posts can be published to your accounts.
            </p>
          </div>
          <Link
            to="/connect"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            Review Consent
          </Link>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-surface animate-pulse border border-border" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl border border-dashed p-8"
          style={{ borderColor: 'var(--color-border, #e2e8f0)', background: 'var(--color-surface, #fff)' }}
        >
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
          >
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-charcoal">All caught up!</h3>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            There are no posts waiting for approval. New AI-generated posts will appear here automatically for your review.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-transform active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              <Sparkles className="w-4 h-4" />
              Generate Daily Post
            </Link>
            <Link
              to="/posts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border hover:bg-surface transition-colors"
              style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
            >
              View Published Posts
            </Link>
          </div>
        </div>
      )}

      {/* Posts List */}
      {!loading && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map(post => {
            const platformKey = (post.platform || 'LINKEDIN').toUpperCase();
            const Icon = PLATFORM_ICONS[platformKey] || Sparkles;
            const theme = PLATFORM_COLORS[platformKey] || {
              bg: '#6366f120',
              text: '#6366f1',
              gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            };
            const isEditing = editingPostId === post.id;
            const isBusy = !!actionLoading[post.id];
            const busyAction = actionLoading[post.id];
            const isFailed = post.status === 'failed';

            return (
              <div
                key={post.id}
                className="rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md"
                style={{
                  background: 'var(--color-surface, #fff)',
                  borderColor: isFailed ? 'rgba(239,68,68,0.3)' : 'var(--color-border, #e2e8f0)',
                }}
              >
                {/* Status Bar */}
                <div
                  className="px-5 py-2.5 flex items-center justify-between border-b text-xs font-medium"
                  style={{
                    background: isFailed ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.04)',
                    borderColor: 'var(--color-border, #e2e8f0)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold"
                      style={{ background: theme.bg, color: theme.text }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {post.platform}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{post.contentGoal?.replace(/_/g, ' ') || 'Daily Post'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFailed ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Posting Failed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Your Approval
                      </span>
                    )}
                  </div>
                </div>

                {/* Failure banner if failed */}
                {isFailed && post.failureReason && (
                  <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Publishing error:</strong> {post.failureReason}
                    </div>
                  </div>
                )}

                {/* Main Content Body */}
                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Image Asset */}
                  <div className="md:col-span-4 flex flex-col gap-2">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                          <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-xs">Visual post asset</span>
                        </div>
                      )}
                    </div>
                    {post.imagePrompt && (
                      <p className="text-[11px] text-muted italic line-clamp-2" title={post.imagePrompt}>
                        Prompt: {post.imagePrompt}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Title, Caption & Editor */}
                  <div className="md:col-span-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-charcoal mb-2">{post.title}</h3>

                      {isEditing ? (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-charcoal">Edit Post Caption:</label>
                          <textarea
                            value={editCaption}
                            onChange={e => setEditCaption(e.target.value)}
                            rows={4}
                            className="w-full p-3 rounded-xl border text-sm leading-relaxed focus:ring-2 focus:ring-accent focus:outline-none"
                            style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(post.id)}
                              disabled={isBusy}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white flex items-center gap-1.5 hover:bg-accent-hover transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingPostId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium border text-muted hover:text-charcoal transition-colors"
                              style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-charcoal/90 leading-relaxed whitespace-pre-wrap">
                            {post.caption}
                          </p>

                          {post.callToAction && (
                            <div className="p-2.5 rounded-lg bg-surface text-xs font-medium text-accent border border-accent/20">
                              👉 {post.callToAction}
                            </div>
                          )}

                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {post.hashtags.map(h => (
                                <span
                                  key={h}
                                  className="text-xs px-2 py-0.5 rounded-md text-muted bg-slate-100 hover:text-charcoal"
                                >
                                  #{h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-6 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      {/* Secondary Actions (Edit, Regenerate, Reject) */}
                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          <button
                            onClick={() => startEditing(post)}
                            disabled={isBusy}
                            className="p-2 rounded-lg text-xs font-medium border text-muted hover:text-charcoal hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                            title="Edit Caption"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleRegenerate(post.id)}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-xs font-medium border text-muted hover:text-charcoal hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                          title="Regenerate with AI"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'regenerating' ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>

                        <button
                          onClick={() => handleReject(post.id)}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-xs font-medium border text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                          style={{ borderColor: 'rgba(239,68,68,0.2)' }}
                          title="Reject Post"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </div>

                      {/* Primary Approval Buttons */}
                      <div className="flex items-center gap-2.5">
                        {isFailed ? (
                          <button
                            onClick={() => handleRetry(post)}
                            disabled={isBusy}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'publishing' ? 'animate-spin' : ''}`} />
                            {busyAction === 'publishing' ? 'Retrying…' : 'Retry Post'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApproveOnly(post.id)}
                              disabled={isBusy}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold border text-charcoal hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                              style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              {busyAction === 'approving' ? 'Approving…' : 'Approve Only'}
                            </button>

                            <button
                              onClick={() => handleApproveAndPost(post)}
                              disabled={isBusy}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
                              style={{
                                background: theme.gradient,
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              <Send className={`w-3.5 h-3.5 ${busyAction === 'publishing' ? 'animate-pulse' : ''}`} />
                              {busyAction === 'publishing' ? 'Publishing…' : `Approve & Post to ${post.platform}`}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueuePage;
