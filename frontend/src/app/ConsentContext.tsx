import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiClient } from '../services/apiClient';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
export interface ConsentRecord {
  id: string;
  userId: string;
  consentVersion: string;
  consentText: string;
  agreedAt: string;
  createdAt: string;
}

export type SocialPlatform = 'LINKEDIN' | 'X' | 'INSTAGRAM' | 'FACEBOOK';

export interface SocialConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  displayName: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED';
  connectedAt: string;
  disconnectedAt: string | null;
}

interface ConsentContextValue {
  /** Whether the user has ever given consent */
  hasConsent: boolean;
  /** The full consent record, or null if not yet given */
  consent: ConsentRecord | null;
  /** All social account connections */
  connections: SocialConnection[];
  /** True while loading consent / connections from the API */
  loading: boolean;
  /** Show the consent modal */
  showConsentModal: boolean;
  setShowConsentModal: (v: boolean) => void;
  /** Call to record consent */
  giveConsent: () => Promise<void>;
  /** Call to revoke consent */
  revokeConsent: () => Promise<void>;
  /** Connect a platform (mock mode for demo) */
  mockConnect: (platform: SocialPlatform, displayName?: string) => Promise<void>;
  /** Disconnect a platform */
  disconnect: (platform: SocialPlatform) => Promise<void>;
  /** Reload state from API */
  refresh: () => Promise<void>;
}

/* ──────────────────────────────────────────────
   Context
────────────────────────────────────────────── */
const ConsentContext = createContext<ConsentContextValue | null>(null);

const CONSENT_KEY = 'postdaily.consent_declined';

/* ──────────────────────────────────────────────
   Mock implementations (VITE_DATA_SOURCE=mock)
────────────────────────────────────────────── */
function useMockConsent(): ConsentContextValue {
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem('postdaily.mock_consent') === 'true';
  });
  const [consent, setConsent] = useState<ConsentRecord | null>(() => {
    const stored = localStorage.getItem('postdaily.mock_consent_record');
    return stored ? JSON.parse(stored) : null;
  });
  const [connections, setConnections] = useState<SocialConnection[]>(() => {
    const stored = localStorage.getItem('postdaily.mock_connections');
    return stored ? JSON.parse(stored) : [];
  });
  const [showConsentModal, setShowConsentModal] = useState(!hasConsent);

  const giveConsent = useCallback(async () => {
    const record: ConsentRecord = {
      id: crypto.randomUUID(),
      userId: 'demo-user',
      consentVersion: '1.0',
      consentText:
        'This app will create social media posts for you. Nothing is posted without your approval.',
      agreedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('postdaily.mock_consent', 'true');
    localStorage.setItem('postdaily.mock_consent_record', JSON.stringify(record));
    setHasConsent(true);
    setConsent(record);
    setShowConsentModal(false);
  }, []);

  const revokeConsent = useCallback(async () => {
    localStorage.removeItem('postdaily.mock_consent');
    localStorage.removeItem('postdaily.mock_consent_record');
    localStorage.removeItem('postdaily.mock_connections');
    setHasConsent(false);
    setConsent(null);
    setConnections([]);
    setShowConsentModal(true);
  }, []);

  const mockConnect = useCallback(async (platform: SocialPlatform, displayName?: string) => {
    const conn: SocialConnection = {
      id: crypto.randomUUID(),
      userId: 'demo-user',
      platform,
      displayName: displayName ?? `demo_${platform.toLowerCase()}_user`,
      status: 'CONNECTED',
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
    };
    setConnections(prev => {
      const next = prev.filter(c => c.platform !== platform).concat(conn);
      localStorage.setItem('postdaily.mock_connections', JSON.stringify(next));
      return next;
    });
  }, []);

  const disconnect = useCallback(async (platform: SocialPlatform) => {
    setConnections(prev => {
      const next = prev.map(c =>
        c.platform === platform
          ? { ...c, status: 'DISCONNECTED' as const, disconnectedAt: new Date().toISOString() }
          : c,
      );
      localStorage.setItem('postdaily.mock_connections', JSON.stringify(next));
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    /* no-op in mock mode */
  }, []);

  return {
    hasConsent,
    consent,
    connections,
    loading: false,
    showConsentModal,
    setShowConsentModal,
    giveConsent,
    revokeConsent,
    mockConnect,
    disconnect,
    refresh,
  };
}

/* ──────────────────────────────────────────────
   API-backed implementation
────────────────────────────────────────────── */
function useApiConsent(): ConsentContextValue {
  const [hasConsent, setHasConsent] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('postdaily.token');
      if (!token) {
        setLoading(false);
        return;
      }

      const [consentRes, connectionsRes] = await Promise.all([
        apiClient<{ hasConsent: boolean; consent: ConsentRecord | null }>('/consent').catch(
          () => ({ hasConsent: false, consent: null }),
        ),
        apiClient<SocialConnection[]>('/social/connections').catch(() => []),
      ]);

      setHasConsent(consentRes.hasConsent);
      setConsent(consentRes.consent);
      setConnections(connectionsRes);
      setShowConsentModal(!consentRes.hasConsent);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const giveConsent = useCallback(async () => {
    const record = await apiClient<ConsentRecord>('/consent', { method: 'POST' });
    setHasConsent(true);
    setConsent(record);
    setShowConsentModal(false);
  }, []);

  const revokeConsent = useCallback(async () => {
    await apiClient('/consent', { method: 'DELETE' });
    setHasConsent(false);
    setConsent(null);
    setConnections([]);
    setShowConsentModal(true);
  }, []);

  const mockConnect = useCallback(async (platform: SocialPlatform, displayName?: string) => {
    const conn = await apiClient<SocialConnection>('/social/mock-connect', {
      method: 'POST',
      body: JSON.stringify({ platform, displayName }),
    });
    setConnections(prev => prev.filter(c => c.platform !== platform).concat(conn));
  }, []);

  const disconnect = useCallback(async (platform: SocialPlatform) => {
    const updated = await apiClient<SocialConnection>(
      `/social/connections/${platform}`,
      { method: 'DELETE' },
    );
    setConnections(prev => prev.map(c => (c.platform === platform ? updated : c)));
  }, []);

  return {
    hasConsent,
    consent,
    connections,
    loading,
    showConsentModal,
    setShowConsentModal,
    giveConsent,
    revokeConsent,
    mockConnect,
    disconnect,
    refresh,
  };
}

/* ──────────────────────────────────────────────
   Provider
────────────────────────────────────────────── */
const dataSource = (import.meta.env.VITE_DATA_SOURCE as string) || 'mock';

function MockConsentProvider({ children }: { children: React.ReactNode }) {
  const value = useMockConsent();
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

function ApiConsentProvider({ children }: { children: React.ReactNode }) {
  const value = useApiConsent();
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  if (dataSource === 'api') {
    return <ApiConsentProvider>{children}</ApiConsentProvider>;
  }
  return <MockConsentProvider>{children}</MockConsentProvider>;
}

/* ──────────────────────────────────────────────
   Hook
────────────────────────────────────────────── */
export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within <ConsentProvider>');
  return ctx;
}
