import { AssistantCloud } from '@assistant-ui/react';

export type ReadonlyJSONValue =
  | null
  | string
  | number
  | boolean
  | ReadonlyJSONObject
  | ReadonlyJSONArray;

export type ReadonlyJSONObject = {
  readonly [key: string]: ReadonlyJSONValue;
};

export type ReadonlyJSONArray = readonly ReadonlyJSONValue[];

export type CloudMessage = {
  id: string;
  parent_id: string | null;
  height: number;
  created_at: Date;
  updated_at: Date;
  format: 'aui/v0' | string;
  content: ReadonlyJSONObject;
};

export type AssistantCloudThreadMessageListQuery = {
  format?: string;
};

export type AssistantCloudThreadMessageListResponse = {
  messages: CloudMessage[];
};

export type AssistantCloudThreadMessageCreateBody = {
  parent_id: string | null;
  format: 'aui/v0' | string;
  content: ReadonlyJSONObject;
};

export type AssistantCloudMessageCreateResponse = {
  message_id: string;
};

export type AssistantCloudConfig = ConstructorParameters<
  typeof AssistantCloud
>[0];
export type AssistantCloudThreads = typeof AssistantCloud.prototype.threads;
export type AssistantCloudThreadMessages =
  typeof AssistantCloud.prototype.threads.messages;
export type AssistantCloudAPI = ConstructorParameters<typeof AssistantCloud>[0];
export type AssistantCloudThreadsListQuery = Parameters<
  AssistantCloudThreads['list']
>[0];
export type AssistantCloudThreadsListResponse = Awaited<
  ReturnType<AssistantCloudThreads['list']>
>;
export type AssistantCloudThreadsCreateBody = Parameters<
  AssistantCloudThreads['create']
>[0];
export type AssistantCloudThreadsCreateResponse = Awaited<
  ReturnType<AssistantCloudThreads['create']>
>;
export type AssistantCloudThreadsUpdateBody = Parameters<
  AssistantCloudThreads['update']
>[1];

export type CloudThread = AssistantCloudThreadsListResponse['threads'][number];
