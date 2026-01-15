/**
 * useBeforeUnload - Hook to warn user before leaving with unsaved changes
 */

import { useEffect } from 'react';

export function useBeforeUnload(isDirty: boolean, message?: string) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Most modern browsers ignore custom messages and show their own
      e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);
}
