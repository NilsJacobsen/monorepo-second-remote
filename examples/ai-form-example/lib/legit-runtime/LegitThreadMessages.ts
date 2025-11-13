import type {
  AssistantCloudMessageCreateResponse,
  AssistantCloudThreadMessageCreateBody,
  AssistantCloudThreadMessageListQuery,
  AssistantCloudThreadMessageListResponse,
  CloudMessage,
} from './types';
import { readJson, writeJson } from './storage';

type StoredMessage = Omit<CloudMessage, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at: string;
};

function getMessagesPath(threadId: string) {
  return `/.legit/branches/${threadId}/messages.json`;
}

export class LegitThreadMessages {
  public async list(
    threadId: string,
    _query?: AssistantCloudThreadMessageListQuery
  ): Promise<AssistantCloudThreadMessageListResponse> {
    const stored = await readJson<StoredMessage[]>(
      getMessagesPath(threadId),
      []
    );

    const messages: CloudMessage[] = stored.map((message, index) => ({
      ...message,
      height: index,
      created_at: new Date(message.created_at),
      updated_at: new Date(message.updated_at),
    }));

    return { messages };
  }

  public async create(
    threadId: string,
    body: AssistantCloudThreadMessageCreateBody
  ): Promise<AssistantCloudMessageCreateResponse> {
    const path = getMessagesPath(threadId);
    const stored = await readJson<StoredMessage[]>(path, []);
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();

    stored.push({
      id: messageId,
      parent_id: body.parent_id ?? null,
      height: stored.length,
      created_at: createdAt,
      updated_at: createdAt,
      format: body.format,
      content: body.content,
    });

    await writeJson(path, stored);

    return { message_id: messageId };
  }
}
