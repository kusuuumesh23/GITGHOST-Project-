import React from 'react';
import { useConsent } from './ConsentContext';
import { ConsentModal } from './ConsentModal';
import { router } from './router';

/**
 * Renders the consent modal when required.
 * Lives outside <RouterProvider> so it overlays all routes.
 */
export const ConsentModalWrapper: React.FC = () => {
  const { showConsentModal } = useConsent();

  if (!showConsentModal) return null;

  return (
    <ConsentModal
      onAccept={() => {
        router.navigate('/connect');
      }}
    />
  );
};

export default ConsentModalWrapper;
