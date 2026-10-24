import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../hooks/useBusiness';
import { useGeneratePost } from '../hooks/useGeneratePost';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Image,
  MessageSquare,
  Tag,
  AlertCircle,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { Post } from '../types/index.js';
import { useConsent } from '../app/ConsentContext';

const CONTENT_GOALS = [
  { value: 'INCREASE_LOCAL_AWARENESS', label: 'Increase Local Awareness' },
  { value: 'PROMOTE_PRODUCT_OR_SERVICE', label: 'Promote Product or Service' },
  { value: 'ANNOUNCE_OFFER', label: 'Announce Offer or Special' },
  { value: 'EDUCATE_AUDIENCE', label: 'Educate Audience' },
  { value: 'BEHIND_THE_SCENES', label: 'Behind the Scenes Story' },
  { value: 'HIGHLIGHT_CUSTOMER_BENEFIT', label: 'Highlight Customer Benefit' },
  { value: 'PROMOTE_EVENT', label: 'Promote Upcoming Event' },
  { value: 'SEASONAL_IDEA', label: 'Seasonal or Timely Idea' },
];

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'X', label: 'X (Twitter)' },
];

export const CreatePostPage: React.FC = () => {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const { generate, regenerateCaption, regenerateImage, isGenerating, progress } = useGeneratePost();
  const { hasConsent, setShowConsentModal } = useConsent();

  const [contentGoal, setContentGoal] = useState('INCREASE_LOCAL_AWARENESS');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [offerOrPromotion, setOfferOrPromotion] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [approvedPost, setApprovedPost] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const generated = await generate(activeBusinessId, {
        contentGoal,
        platform,
        offerOrPromotion: offerOrPromotion || undefined,
        additionalInstructions: additionalInstructions || undefined,
      });
      if (generated) {
        setCurrentPost(generated);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to generate post');
    }
  };

  const handleRegenerateCaption = async () => {
    if (!currentPost) return;
    try {
      const updated = await regenerateCaption(currentPost.id);
      setCurrentPost(updated);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to regenerate caption');
    }
  };

  const handleRegenerateImage = async () => {
    if (!currentPost) return;
    try {
      const updated = await regenerateImage(currentPost.id);
      setCurrentPost(updated);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to regenerate image');
    }
  };

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Create Today's Post</h1>
          <p className="text-sm text-muted">
            Generate one authentic, high-quality post grounded in {activeBusiness?.name || 'your business profile'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-charcoal">Generation Controls</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">Content Goal</label>
              <select
                value={contentGoal}
                onChange={e => setContentGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CONTENT_GOALS.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">Target Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                      platform === p.value
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-border bg-background text-charcoal hover:bg-surface'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">
                Active Offer / Promotion <span className="text-muted">(Optional)</span>
              </label>
              <input
                type="text"
                value={offerOrPromotion}
                onChange={e => setOfferOrPromotion(e.target.value)}
                placeholder="e.g. Free pastry with any 12oz bag purchase"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal">
                Additional Instructions <span className="text-muted">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                placeholder="e.g. Mention our new barista, keep the tone casual..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-status-failed-bg border border-status-failed-border rounded-lg flex items-center gap-2 text-xs text-status-failed-text">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-subtle"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating with DeepSeek ({progress}%)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Today's Post
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Workspace & Preview Column */}
        <div className="lg:col-span-7 space-y-4">
          {!currentPost && !isGenerating && (
            <div className="p-12 bg-surface border border-dashed border-border rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-charcoal">Ready to Generate Today's Post</h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                Select your content goal and platform on the left. DeepSeek will craft an on-brand caption, call-to-action, hashtags, and visual prompt.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="p-8 bg-surface border border-border rounded-xl space-y-4 shadow-subtle">
              <div className="flex items-center justify-between text-sm font-medium text-charcoal">
                <span>Generating your daily post with DeepSeek...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-accent transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted">
                Grounding post facts in {activeBusiness?.name || 'business profile'}, normalizing hashtags, and designing image prompt...
              </p>
            </div>
          )}

          {currentPost && (
            <div className="bg-surface border border-border rounded-xl shadow-subtle overflow-hidden space-y-4 p-6">
              {/* Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold text-xs uppercase tracking-wide">
                    {currentPost.platform}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-status-published-text font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Draft Saved
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerateCaption}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-background transition-colors text-charcoal"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-accent" />
                    Regenerate Caption
                  </button>
                  <button
                    onClick={handleRegenerateImage}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-background transition-colors text-charcoal"
                  >
                    <Image className="w-3.5 h-3.5 text-accent" />
                    Regenerate Image
                  </button>
                </div>
              </div>

              {/* Title & Caption */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-charcoal">{currentPost.title}</h3>
                <div className="p-4 bg-background border border-border rounded-lg text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
                  {currentPost.caption}
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Call to Action</span>
                <p className="text-sm font-medium text-accent bg-accent/5 p-2.5 rounded-lg border border-accent/15">
                  {currentPost.callToAction}
                </p>
              </div>

              {/* Hashtags */}
              {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Hashtags ({currentPost.hashtags.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPost.hashtags.map((tag, i) => (
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

              {/* Visual Prompt */}
              {currentPost.imagePrompt && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                    <Image className="w-3.5 h-3.5" /> AI Visual Prompt
                  </span>
                  <p className="text-xs text-charcoal/80 italic bg-background p-3 rounded-lg border border-border">
                    "{currentPost.imagePrompt}"
                  </p>
                </div>
              )}

              {/* ── STEP 3: APPROVE & PUBLISH GATE ── */}
              <div className="pt-4 border-t border-border">
                {!hasConsent ? (
                  /* No consent → show locked state */
                  <div
                    className="p-4 rounded-xl flex items-start gap-3"
                    style={{
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}
                  >
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#d97706' }}>
                        Posting locked
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        You must give consent before approving posts for publishing.
                      </p>
                      <button
                        id="create-give-consent-btn"
                        onClick={() => setShowConsentModal(true)}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                      >
                        Review &amp; Accept Consent
                      </button>
                    </div>
                  </div>
                ) : approvedPost === currentPost.id ? (
                  /* Already approved */
                  <div
                    className="p-4 rounded-xl flex items-center gap-3"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#059669' }}>
                        Post approved!
                      </p>
                      <p className="text-xs text-muted">
                        This post has been approved and will be published as scheduled.
                      </p>
                      <Link to="/approval" className="text-xs font-semibold text-accent hover:underline mt-1 inline-block">
                        View in Approval Queue →
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Consent given, not yet approved → show approve button */
                  <button
                    id="approve-post-btn"
                    onClick={() => setApprovedPost(currentPost.id)}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.35)';
                    }}
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Approve &amp; Schedule Post
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
