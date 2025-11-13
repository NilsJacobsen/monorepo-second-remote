'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { type LegitFsInstance } from './types';
import { getLegitFs } from './storage';

type LegitFsContextValue = {
  legitFs: LegitFsInstance | null;
  loading: boolean;
  error: Error | null;
};

const LegitFsContext = createContext<LegitFsContextValue | undefined>(
  undefined
);

export function LegitFsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LegitFsContextValue>({
    legitFs: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const legitFs = await getLegitFs();
        if (!cancelled) {
          setState({ legitFs, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            legitFs: null,
            loading: false,
            error:
              error instanceof Error
                ? error
                : new Error(String(error ?? 'Unknown error')),
          });
        }
      }
    };

    setState(prev => ({ ...prev, loading: true, error: null }));
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <LegitFsContext.Provider value={value}>{children}</LegitFsContext.Provider>
  );
}

export function useLegitFs(): LegitFsContextValue {
  const context = useContext(LegitFsContext);

  if (context === undefined) {
    throw new Error('useLegitFs must be used within a LegitFsProvider');
  }

  return context;
}
