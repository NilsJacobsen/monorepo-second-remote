'use client';

import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  useThread,
} from '@assistant-ui/react';

import { Thread } from '@/components/assistant-ui/thread';
import { ThreadList } from '@/components/assistant-ui/thread-list';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import { Folder, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShowFileChangesToolUI } from '@/components/assistant-ui/tools';
import React from 'react';
import { useDataStreamRuntime } from '@assistant-ui/react-data-stream';

import { LegitLocal } from '@/components/assistant-ui/runtime/LegitLocal';

const getCurrentWorkingDirectory = async () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const state = (await window.electronAPI.getAppState()) as {
        settings?: { path?: string };
      };
      return state.settings?.path || '';
    } catch (error) {
      console.error('Failed to get current working directory:', error);
      return '';
    }
  }
  return '';
};

const legitCloud = new LegitLocal({
  // NOTE this should not be used at all
  baseUrl: '/api/chat',
  authToken: async () => 'test',
});

export const Assistant = () => {
  const [currentWorkingDirectory, setCurrentWorkingDirectory] =
    useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const loadWorkingDirectory = async () => {
      const cwd = await getCurrentWorkingDirectory();
      setCurrentWorkingDirectory(cwd);
    };
    loadWorkingDirectory();
  }, []);

  const runtime = useDataStreamRuntime({
    cloud: legitCloud,

    api: '/api/chat',
    body: {
      currentWorkingDirectory,
    },
    headers: async () => {
      console.log('getting headers');
      await new Promise(resolve => setTimeout(resolve, 1));
      return (window as any).threadContext;
    },
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
  });

  legitCloud.runtime = runtime;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-screen">
        {/* Fixed Header at top */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-white z-50">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mr-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-transparent">
              <div className="w-4 h-4 border-3 border-primary-accent rounded-full" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold text-black text-md">Legit</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <TooltipIconButton
              className="p-4"
              tooltip="Open folder"
              side="bottom"
              onClick={() => {
                if (typeof window !== 'undefined' && window.electronAPI) {
                  window.electronAPI.openFolder().catch(error => {
                    console.error('Failed to open folder:', error);
                  });
                }
              }}
            >
              <Folder />
            </TooltipIconButton>
            <Link href="/settings">
              <TooltipIconButton
                className="p-4"
                tooltip="Settings"
                side="bottom"
              >
                <Settings2 />
              </TooltipIconButton>
            </Link>
          </div>
        </header>

        {/* Main content area below header */}
        <div className="flex flex-1 overflow-hidden">
          {/* Custom Collapsible Sidebar */}
          <div
            className={`bg-gray-50 border-r transition-all duration-200 ease-in-out ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            } flex-shrink-0 flex flex-col`}
          >
            <div className="flex-1 overflow-hidden">
              <ThreadList collapsed={sidebarCollapsed} />
            </div>
          </div>

          {/* Main chat area - remaining space */}
          <div className="flex-1 overflow-hidden">
            <Thread />
            <ShowFileChangesToolUI />
          </div>
        </div>
      </div>

      <PersistAdapter />
    </AssistantRuntimeProvider>
  );
};

const PersistAdapter: React.FC = () => {
  const messages = useThread(m => m.messages);
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced save on message changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // saveTimerRef.current = setTimeout(() => {
    //   // Persist current thread messages
    //   console.log('Saving messages', messages);
    //   window.electronAPI
    //     ?.savePersistedMessages(
    //       messages as unknown as Array<import('ai').Message>
    //     )
    //     .catch(error =>
    //       console.error('Failed to save persisted messages:', error)
    //     );
    // }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages]);

  return null;
};
