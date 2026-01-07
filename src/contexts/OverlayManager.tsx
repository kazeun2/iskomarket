import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

export type OverlayName = 'profile' | 'creditScoreHistory' | 'productDetail' | 'notice' | 'warningConfirmation' | 'productDelete' | null;

export interface OverlayState {
  name: OverlayName;
  props?: any;
}

interface OverlayContextValue {
  overlay: OverlayState;
  show: (name: NonNullable<OverlayState['name']>, props?: any) => void;
  hide: () => void;
  replace: (name: NonNullable<OverlayState['name']>, props?: any) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export const useOverlayManager = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlayManager must be used within OverlayProvider');
  return ctx;
};

// Non-throwing optional hook for callers that may render outside of an OverlayProvider.
// Use this when you want to safely check for an overlay manager without causing an exception
// that would disrupt React's hooks ordering.
export const useOptionalOverlayManager = () => {
  return useContext(OverlayContext) as OverlayContextValue | null;
};

// OverlayManager: single, screen-level overlay manager
// Why: Nested dialogs (a dialog opened on top of another dialog) frequently suffer
// from stacking-context and overlay pointer-blocking issues. CSS properties like
// transform, opacity, and z-index on ancestor elements can create new stacking
// contexts so the child dialog's z-index can't escape the parent. By providing a
// single top-level overlay host (portal) and a simple named overlay state, we
// ensure only one major overlay is visible at a time and avoid z-index clashes.
export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const [overlay, setOverlay] = useState<OverlayState>({ name: null, props: undefined });

  const show = useCallback((name: NonNullable<OverlayState['name']>, props?: any) => {
    setOverlay({ name, props });
    try { document.body.classList.add('modal-open'); } catch (e) {}
  }, []);

  const hide = useCallback(() => {
    setOverlay({ name: null, props: undefined });
    try { document.body.classList.remove('modal-open'); } catch (e) {}
  }, []);

  const replace = useCallback((name: NonNullable<OverlayState['name']>, props?: any) => {
    setOverlay({ name, props });
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOverlay({ name: null, props: undefined });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <OverlayContext.Provider value={{ overlay, show, hide, replace }}>
      {children}
    </OverlayContext.Provider>
  );
};
