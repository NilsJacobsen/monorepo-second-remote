'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadUserMessage,
} from '@assistant-ui/react';
import { useEffect } from 'react';

export interface Thread {
  id: string;
  title: string;
  messages: ThreadMessage[];
  createdAt: Date;
  lastMessageAt: Date;
}

interface ThreadContextType {
  threads: Thread[];
  currentThreadId: string | null;
  createNewThread: () => Promise<string>;
  switchToThread: (threadId: string) => void;
  updateThreadMessages: (threadId: string, messages: ThreadMessage[]) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  deleteThread: (threadId: string) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export const useThreadContext = () => {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error('useThreadContext must be used within a ThreadProvider');
  }
  return context;
};

type Operation = {
  sessionId: string;
  messageId: string;
  role: string;
  message: string; // JSON stringified content
  date: string;
  commit: string | null;
};

function reconstructThreadMessages(operationsUnparsed: any[]) {
  type Operation = {
    sessionId: string;
    messageId: string;
    role: string;
    message: string; // JSON stringified content
    date: string;
    commit: string | null;
    metadata?: any;
  };

  const messageMap = new Map<string, ThreadMessage>();

  for (const operationUnparsed of operationsUnparsed) {
    let op: Operation;
    try {
      op = JSON.parse(operationUnparsed);
    } catch {
      console.log(
        'Skipping operation with invalid JSON message:',
        operationUnparsed
      );
      continue;
    }

    let content;
    try {
      content = JSON.parse(op.message);
    } catch {
      content = op.message;
    }

    if (!messageMap.has(op.messageId)) {
      if (op.role === 'user') {
        const msg: ThreadUserMessage = {
          id: op.messageId,
          role: 'user',
          createdAt: op.date ? new Date(op.date) : new Date(),
          content: [content],
          attachments: [],
          metadata: { custom: {} },
        };
        messageMap.set(op.messageId, msg);
      } else if (op.role === 'assistant') {
        const msg: ThreadAssistantMessage = {
          id: op.messageId,
          role: 'assistant',
          createdAt: op.date ? new Date(op.date) : new Date(),
          content: [content],
          status: { type: 'complete', reason: 'stop' },
          metadata: {
            unstable_state: [],
            unstable_annotations: [],
            unstable_data: [],
            steps: [],
            custom: {},
          },
        };
        messageMap.set(op.messageId, msg);
      } else if (op.role === 'system') {
        const msg: ThreadSystemMessage = {
          id: op.messageId,
          role: 'system',
          createdAt: op.date ? new Date(op.date) : new Date(),
          content: [content],
          metadata: { custom: {} },
        };
        messageMap.set(op.messageId, msg);
      }
    } else {
      // If multiple contents per messageId, push to content array
      (messageMap.get(op.messageId) as any).content.push(content);
    }
  }

  return Array.from(messageMap.values()).sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
}

export const ThreadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  async function loadThreads() {
    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      console.warn('not in an electron window');
      return;
    }

    const state = (await window.electronAPI.getAppState()) as any;

    if (state.settings.path === undefined) {
      console.log('no path set yet');
      return;
    }
    try {
      // TODO use .legit/branches instead - when the settings is set correctly
      const dirPath = `${state.settings.path}/.legit/branches`;
      const branchFolders = (await window.electronAPI.readDir(
        dirPath
      )) as string[];
      console.log('Branch files:', branchFolders);

      const threads: Thread[] = [];
      for (const branchName of branchFolders) {
        if (
          !branchName.startsWith('legit-thread-') ||
          branchName.endsWith('-operation')
        ) {
          continue;
        }

        const operationsPath = `${state.settings.path}/.legit/branches/${branchName}/.legit/operationHistory`;
        const operationHistoryContent = await window.electronAPI.readFile(
          operationsPath,
          'utf-8'
        );

        console.log(operationHistoryContent);
        let messages: ThreadMessage[] = [];

        if (operationHistoryContent !== '') {
          messages = reconstructThreadMessages(
            JSON.parse(operationHistoryContent)
          );
        }
        threads.push({
          id: branchName,
          title: branchName as string,
          messages,
          createdAt: new Date(),
          lastMessageAt: new Date(),
        });
      }

      setThreads(threads);
      // If there is no currentThreadId or it is not in the loaded threads, set to first thread if available
      setCurrentThreadId(prevId => {
        if (threads.length === 0) return null;
        if (prevId && threads.some(t => t.id === prevId)) return prevId;
        return threads[0].id;
      });
    } catch (err) {
      console.error('Failed to read branches directory:', err);
    }
    console.log('loaded state', state);
  }

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        await loadThreads();
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    loop();

    return () => {
      cancelled = true;
    };
  }, []);

  const createNewThread = useCallback(async () => {
    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      throw new Error('not in an electron window');
    }

    const newThread: Thread = {
      id: `legit-thread-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };

    const state = (await window.electronAPI.getAppState()) as any;

    if (state.settings.path === undefined) {
      console.log('no path set yet');
      throw new Error('no path set yet');
    }
    try {
      // TODO use .legit/branches instead - when the settings is set correctly
      const newBranchPath = `${state.settings.path}/.legit/branches/${newThread.id}`;
      await window.electronAPI.mkdir(newBranchPath);
    } catch (err) {
      console.error('Failed to read branches directory:', err);
      throw err;
    }

    setThreads(prev => [...prev, newThread]);
    setCurrentThreadId(newThread.id);
    return newThread.id;
  }, []);

  const switchToThread = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
  }, []);

  const updateThreadMessages = useCallback(
    (threadId: string, messages: ThreadMessage[]) => {
      setThreads(prev =>
        prev.map(thread =>
          thread.id === threadId
            ? { ...thread, messages, lastMessageAt: new Date() }
            : thread
        )
      );
    },
    []
  );

  const updateThreadTitle = useCallback((threadId: string, title: string) => {
    setThreads(prev =>
      prev.map(thread =>
        thread.id === threadId ? { ...thread, title } : thread
      )
    );
  }, []);

  const deleteThread = useCallback(
    (threadId: string) => {
      setThreads(prev => {
        const filtered = prev.filter(thread => thread.id !== threadId);
        if (currentThreadId === threadId) {
          setCurrentThreadId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [currentThreadId]
  );

  const value: ThreadContextType = {
    threads,
    currentThreadId,
    createNewThread,
    switchToThread,
    updateThreadMessages,
    updateThreadTitle,
    deleteThread,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
};
