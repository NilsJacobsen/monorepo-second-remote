'use client';

import { useEffect } from 'react';
import { useAssistantApi } from '@assistant-ui/react';

import { syncThreadFromLegitFs, useLegitFs } from '@/lib/legit-runtime';
import { readHead } from './storage';

const POLL_INTERVAL_MS = 300;

export function LegitFsHeadPoller() {
  const { legitFs } = useLegitFs();
  const api = useAssistantApi();
  const threadApi = api.thread();
  const threadId = 'main';

  useEffect(() => {
    if (!legitFs || !threadId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSyncedHead: string | null = null;

    const scheduleNext = () => {
      if (!cancelled) {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    const tick = async () => {
      try {
        const head = await readHead(threadId);
        if (cancelled) {
          return;
        }

        if (head === lastSyncedHead) {
          return;
        }

        const { isRunning, isLoading } = threadApi.getState();
        if (isRunning || isLoading) {
          // Wait until the thread is idle to avoid interrupting active runs.
          return;
        }

        await syncThreadFromLegitFs({
          threadId,
          threadApi,
        });
        lastSyncedHead = head;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== 'ENOENT') {
          console.error('Failed to poll Legit head', error);
        }
      } finally {
        scheduleNext();
      }
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [legitFs, threadApi, threadId]);

  return null;
}
