'use client';

import {
  ExportedMessageRepository,
  type ThreadMessageLike,
} from '@assistant-ui/react';

import type { CloudMessage } from './types';
import { readJson, readOperationHistory } from './storage';
import { createUIMessages } from './createUIMessages';

type SyncOptions = {
  threadId: string;
  threadApi: {
    import: (
      repository: ReturnType<typeof ExportedMessageRepository.fromArray>
    ) => void;
    reset?: (initialMessages?: readonly ThreadMessageLike[]) => void;
  };
};

type StoredMessage = Omit<CloudMessage, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at: string;
};

const DEFAULT_THREAD_FORMAT = 'aui/v0';

// Normalize the message to the ThreadMessageLike format
function toThreadMessageLike(
  message: StoredMessage | CloudMessage
): ThreadMessageLike | null {
  if (message.format !== DEFAULT_THREAD_FORMAT) {
    return null;
  }

  const raw = message.content as Partial<ThreadMessageLike> | undefined;
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const role = raw.role;
  if (role !== 'assistant' && role !== 'user' && role !== 'system') {
    return null;
  }

  const content = raw.content ?? [];
  const normalizedContent =
    typeof content === 'string' || Array.isArray(content) ? content : [];

  const createdAtValue =
    raw.createdAt instanceof Date
      ? raw.createdAt
      : raw.createdAt
        ? new Date(raw.createdAt)
        : new Date(message.created_at);

  const metadata = raw.metadata ?? { custom: {} };

  return {
    ...raw,
    role,
    content: normalizedContent,
    id: raw.id ?? message.id,
    createdAt: createdAtValue,
    metadata,
  } as ThreadMessageLike;
}

export async function syncThreadFromLegitFs({
  threadId,
  threadApi,
}: SyncOptions): Promise<void> {
  const operationHistory = await readOperationHistory(threadId);
  const operationHistoryUI = await createUIMessages(operationHistory);

  const threadMessages = operationHistoryUI
    .map(toThreadMessageLike)
    .filter((message): message is ThreadMessageLike => message !== null);

  // Update the runtime's thread state
  threadApi.reset(threadMessages);

  // Ensure the client API stays in sync with the runtime state
  threadApi.import(ExportedMessageRepository.fromArray(threadMessages));
}
