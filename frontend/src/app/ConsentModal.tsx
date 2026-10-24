import React, { useState, useCallback } from 'react';
import { Shield, CheckCircle2, XCircle, Linkedin, Twitter, Lock } from 'lucide-react';
import { useConsent } from './ConsentContext';

const CONSENT_TEXT_VERSION = '1.0';
const CONSENT_TEXT = `This app will create social media posts for you. Nothing is posted without your approval. By accepting, you allow us to connect your LinkedIn and X (Twitter) accounts and publish ONLY the posts you approve. You can disconnect anytime.`;

interface ConsentModalProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept, onDecline }) => {
  const { giveConsent, setShowConsentModal } = useConsent();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [declined, setDeclined] = useState(false);

  const handleAccept = useCallback(async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await giveConsent();
      onAccept?.();
    } finally {
      setLoading(false);
    }
  }, [agreed, giveConsent, onAccept]);

  const handleDecline = useCallback(() => {
    setDeclined(true);
    setShowConsentModal(false);
    onDecline?.();
  }, [setShowConsentModal, onDecline]);

  if (declined) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
    >
      {/* Card */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          border: '1px solid rgba(99,102,241,0.35)',
        }}
      >
        {/* Glow accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 p-8">
          {/* Icon + title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 0 32px rgba(99,102,241,0.4)',
              }}
            >
              <Shield className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h2
              id="consent-title"
              className="text-2xl font-bold text-white mb-2"
              style={{ letterSpacing: '-0.02em' }}
            >
              Allow us to post on your behalf
            </h2>
            <p className="text-sm" style={{ color: '#a5b4fc' }}>
              Version {CONSENT_TEXT_VERSION} · PostDaily
            </p>
          </div>

          {/* What we'll do */}
          <div
            className="rounded-xl p-5 mb-6 space-y-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p id="consent-description" className="text-sm leading-relaxed" style={{ color: '#c7d2fe' }}>
              {CONSENT_TEXT}
            </p>

            <div className="pt-3 border-t border-white/10 space-y-2">
              {[
                { icon: Linkedin, text: 'Connect your LinkedIn account (optional)', color: '#0A66C2' },
                { icon: Twitter, text: 'Connect your X (Twitter) account (optional)', color: '#1DA1F2' },
                { icon: Lock, text: 'Only posts you personally approve get published', color: '#10b981' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} aria-hidden="true" />
                  </div>
                  <span className="text-xs" style={{ color: '#e0e7ff' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkbox agreement */}
          <label
            htmlFor="consent-checkbox"
            className="flex items-start gap-3 mb-6 cursor-pointer group"
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                id="consent-checkbox"
                type="checkbox"
                className="sr-only"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200"
                style={{
                  borderColor: agreed ? '#6366f1' : 'rgba(255,255,255,0.3)',
                  background: agreed
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'transparent',
                  boxShadow: agreed ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
                }}
              >
                {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
              </div>
            </div>
            <span
              className="text-sm leading-relaxed transition-colors"
              style={{ color: agreed ? '#e0e7ff' : '#94a3b8' }}
            >
              I understand and agree to allow PostDaily to connect and post to my social accounts,
              subject only to my explicit per-post approval.
            </span>
          </label>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              id="consent-accept-btn"
              onClick={handleAccept}
              disabled={!agreed || loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden"
              style={{
                background: agreed
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'rgba(99,102,241,0.2)',
                color: agreed ? '#fff' : 'rgba(255,255,255,0.35)',
                cursor: agreed && !loading ? 'pointer' : 'not-allowed',
                boxShadow: agreed ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
                transform: agreed && !loading ? 'none' : 'none',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Saving consent…
                </span>
              ) : (
                'Accept & Continue'
              )}
            </button>

            <button
              id="consent-decline-btn"
              onClick={handleDecline}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: '#64748b',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Decline – I'll do this later
              </span>
            </button>
          </div>

          {/* Fine print */}
          <p className="mt-5 text-center text-xs" style={{ color: '#475569' }}>
            Declining locks posting &amp; connect features. You can accept anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
