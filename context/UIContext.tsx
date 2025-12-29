import React, { createContext, useContext, ReactNode } from 'react';
import { useAppState, AppState } from '../hooks/useAppState';

const UIContext = createContext<AppState | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const appState = useAppState();
  return (
    <UIContext.Provider value={appState}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

