'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import { type LegitFsInstance } from './types';
import { getLegitFs, readOperationHistory } from './storage';

export const DEFAULT_THREAD_ID = 'main';
export const BRANCH_ROOT = '/.legit/branches';

const resolveThreadPath = (path: string): string => {
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  return `${BRANCH_ROOT}/${DEFAULT_THREAD_ID}/${path}`;
};

type SaveDataFn = (
  path: string,
  data: Parameters<LegitFsInstance['promises']['writeFile']>[1]
) => Promise<void>;

type GetMessageDiffFn = (messageId: string) => Promise<void>;

type LegitFsContextValue = {
  legitFs: LegitFsInstance | null;
  loading: boolean;
  error: Error | null;
  saveData: SaveDataFn;
  getMessageDiff: GetMessageDiffFn;
  threadId: string;
  resolvePath: (path: string) => string;
};

const normalizeError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));

const LegitFsContext = createContext<LegitFsContextValue | undefined>(
  undefined
);

export function LegitFsProvider({ children }: { children: ReactNode }) {
  const [legitFs, setLegitFs] = useState<LegitFsInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const legitFs = await getLegitFs();
        if (!cancelled) {
          setLegitFs(legitFs);
          setError(null);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          const err = normalizeError(error);
          setLegitFs(null);
          setError(err);
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setError(null);
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveData = useCallback<SaveDataFn>(
    async (path, data) => {
      if (legitFs) {
        const targetPath = resolveThreadPath(path);
        await legitFs.promises.writeFile(targetPath, data);
      }
    },
    [legitFs]
  );

  const getMessageDiff = useCallback<GetMessageDiffFn>(
    async messageId => {
      if (legitFs) {
        console.log('getMessageDiff', messageId);
      }
    },
    [legitFs]
  );

  const value = useMemo<LegitFsContextValue>(
    () => ({
      legitFs,
      loading,
      error,
      saveData,
      getMessageDiff,
      threadId: DEFAULT_THREAD_ID,
      resolvePath: resolveThreadPath,
    }),
    [legitFs, loading, error, saveData]
  );

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
