import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ExternalLink,
  Unlink,
  AlertTriangle,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useConsent, SocialPlatform } from '../app/ConsentContext';
import { apiClient } from '../services/apiClient';

interface PlatformConfig {
  platform: SocialPlatform;
  label: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgGradient: string;
  description: string;
  authType: string;
  scopes: string[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    platform: 'LINKEDIN',
    label: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    bgGradient: 'linear-gradient(135deg, #0A66C2, #0077B5)',
    description: 'Publish professional posts to your LinkedIn profile or company page.',
    authType: 'OAuth 2.0 Authorization Code',
    scopes: ['openid', 'profile', 'w_member_social'],
  },
  {
    platform: 'X',
    label: 'X (Twitter)',
    icon: Twitter,
    color: '#1DA1F2',
    bgGradient: 'linear-gradient(135deg, #1DA1F2, #0d7fc0)',
    description: 'Post tweets and threads to grow your audience on X.',
    authType: 'OAuth 2.0 with PKCE',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  {
    platform: 'INSTAGRAM',
    label: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
    bgGradient: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    description: 'Share stunning visuals and captions on Instagram.',
    authType: 'Meta Graph API OAuth',
    scopes: ['instagram_basic', 'instagram_content_publish'],
  },
  {
    platform: 'FACEBOOK',
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    bgGradient: 'linear-gradient(135deg, #1877F2, #0d5ecb)',
    description: 'Post to your Facebook page and reach your local community.',
    authType: 'Meta OAuth 2.0',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
  },
];

export const ConnectAccountsPage: React.FC = () => {
  const { hasConsent, connections, mockConnect, disconnect, refresh } = useConsent();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPlatform, setLoadingPlatform] = useState<SocialPlatform | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam) {
      setBannerNotice({
        message: `Successfully connected ${connectedParam.toUpperCase()} account via OAuth 2.0! Tokens are encrypted and stored securely.`,
        type: 'success',
      });
      refresh();
      // Clean query params
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
    } else if (errorParam) {
      const errorMsg =
        errorParam === 'linkedin_denied'
          ? 'LinkedIn authorization was cancelled or denied.'
          : errorParam === 'x_denied'
          ? 'X authorization was cancelled or denied.'
          : 'Authentication failed. Please verify your developer application credentials.';
      setBannerNotice({ message: errorMsg, type: 'error' });
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refresh]);

  const getConnection = (platform: SocialPlatform) =>
    connections.find(c => c.platform === platform && c.status === 'CONNECTED');

  const handleConnect = async (platform: SocialPlatform) => {
    if (!hasConsent) return;
    setLoadingPlatform(platform);

    try {
      const isApiMode = import.meta.env.VITE_DATA_SOURCE === 'api';

      if (isApiMode && (platform === 'LINKEDIN' || platform === 'X')) {
        // Fetch OAuth authorization URL from backend
        const endpoint = `/auth/${platform.toLowerCase()}/start?format=json`;
        const res = await apiClient<{ authUrl: string }>(endpoint);
        if (res && res.authUrl) {
          window.location.href = res.authUrl;
          return;
        }
      }

      // Default or demo mode: simulated secure connection
      await mockConnect(platform);
      setBannerNotice({
        message: `${platform} connected in demo mode! You can now approve and post to this platform.`,
        type: 'success',
      });
    } catch (err: any) {
      setBannerNotice({
        message: err.message || `Failed to initiate connection to ${platform}`,
        type: 'error',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    setLoadingPlatform(platform);
    try {
      await disconnect(platform);
      setBannerNotice({
        message: `Disconnected ${platform}. All stored tokens have been securely removed.`,
        type: 'success',
      });
    } catch (err: any) {
      setBannerNotice({
        message: err.message || `Failed to disconnect ${platform}`,
        type: 'error',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Connect Your Accounts</h1>
        <p className="text-sm text-muted mt-1">
          Link your LinkedIn and X profiles via official OAuth 2.0 flows. We never see or store your password, and all access tokens are encrypted at rest with AES-256.
        </p>
      </div>

      {/* Banner Notice (OAuth callback results) */}
      {bannerNotice && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 p-4 rounded-xl text-xs font-medium border"
          style={{
            background: bannerNotice.type === 'success' ? '#065f4615' : '#991b1b15',
            borderColor: bannerNotice.type === 'success' ? '#10b981' : '#f87171',
            color: bannerNotice.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          <div className="flex items-center gap-2">
            {bannerNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{bannerNotice.message}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-muted hover:text-charcoal transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Consent gate banner */}
      {!hasConsent && (
        <div
          className="flex items-start gap-4 rounded-xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))',
            borderColor: 'rgba(245,158,11,0.3)',
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)' }}
          >
            <Lock className="w-5 h-5 text-amber-500" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#d97706' }}>
              Consent required before connecting accounts
            </p>
            <p className="text-xs text-muted mt-0.5">
              To protect your privacy and comply with social network policies, you must first accept the posting consent agreement before any social accounts can be connected.
            </p>
          </div>
        </div>
      )}

      {/* Platform grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map(cfg => {
          const connection = getConnection(cfg.platform);
          const isConnected = !!connection;
          const isLoading = loadingPlatform === cfg.platform;
          const Icon = cfg.icon;

          return (
            <div
              key={cfg.platform}
              className="rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between"
              style={{
                background: isConnected
                  ? `linear-gradient(145deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))`
                  : 'var(--color-surface, #fff)',
                borderColor: isConnected ? 'rgba(16,185,129,0.3)' : 'var(--color-border, #e5e7eb)',
                boxShadow: isConnected ? '0 0 0 1px rgba(16,185,129,0.15)' : undefined,
              }}
            >
              <div>
                {/* Platform header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
                    style={{ background: cfg.bgGradient }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-charcoal">{cfg.label}</span>
                      {isConnected && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0"
                          style={{
                            background: 'rgba(16,185,129,0.12)',
                            color: '#059669',
                            border: '1px solid rgba(16,185,129,0.25)',
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          Connected
                        </span>
                      )}
                    </div>
                    {isConnected && connection.displayName && (
                      <p className="text-xs text-muted mt-0.5 truncate font-mono">
                        @{connection.displayName}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted mb-3 leading-relaxed">{cfg.description}</p>

                {/* Scopes & Security Info */}
                <div className="mb-4 p-2.5 rounded-lg bg-surface text-[11px] text-muted border border-border space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-charcoal">
                    <KeyRound className="w-3 h-3 text-accent" />
                    <span>{cfg.authType}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {cfg.scopes.map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action button */}
              {isConnected ? (
                <button
                  id={`disconnect-${cfg.platform.toLowerCase()}-btn`}
                  onClick={() => handleDisconnect(cfg.platform)}
                  disabled={isLoading}
                  className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                    cursor: isLoading ? 'wait' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isLoading) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {isLoading ? 'Disconnecting…' : `Disconnect ${cfg.label}`}
                </button>
              ) : (
                <button
                  id={`connect-${cfg.platform.toLowerCase()}-btn`}
                  onClick={() => handleConnect(cfg.platform)}
                  disabled={!hasConsent || isLoading}
                  className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 shadow-sm"
                  style={{
                    background: hasConsent ? cfg.bgGradient : 'rgba(0,0,0,0.04)',
                    color: hasConsent ? '#fff' : '#94a3b8',
                    cursor: !hasConsent ? 'not-allowed' : isLoading ? 'wait' : 'pointer',
                    boxShadow: hasConsent ? `0 2px 12px ${cfg.color}33` : 'none',
                    opacity: hasConsent ? 1 : 0.6,
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : hasConsent ? (
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {isLoading
                    ? 'Connecting…'
                    : hasConsent
                    ? `Connect ${cfg.label}`
                    : 'Consent required'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Guarantee Card */}
      <div
        className="flex gap-3.5 rounded-2xl p-5 text-xs border"
        style={{
          background: 'linear-gradient(145deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
          borderColor: 'rgba(99,102,241,0.2)',
          color: '#4338ca',
        }}
      >
        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-accent" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-charcoal">Strict Privacy &amp; Security Guarantee</p>
          <p className="leading-relaxed text-muted">
            All OAuth tokens are encrypted at rest using AES-256-GCM and are never sent to the browser or logged in plain text.
            We use PKCE verification for X (Twitter) and state CSRF validation on all callbacks.
            PostDaily <strong>never</strong> posts anything automatically; each post must be individually reviewed and approved by you in the <strong>Approval Queue</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectAccountsPage;
