import { handleClientScriptLoad } from 'next/script';
import {
  CloudThread,
  CloudMessage,
  AssistantCloudThreadMessages,
  AssistantCloudAPI,
  AssistantCloudThreadMessageListQuery,
  AssistantCloudThreadMessageListResponse,
  AssistantCloudThreadMessageCreateBody,
  AssistantCloudMessageCreateResponse,
} from './types';

import { Operation } from '@legit-sdk/core';

export const threads: (CloudThread & { messages: CloudMessage[] })[] = [];

// id: of the message is the commit (we will retrive this on the fly)
// height: is the commits of the operation branch - no need to store them
type CloudMessageWithoutId = Omit<CloudMessage, 'id' | 'height' | 'parent_id'>;

// @ts-expect-error
export class LegitThreadMessages implements AssistantCloudThreadMessages {
  constructor(private cloud: AssistantCloudAPI) {}

  public async list(
    threadId: string,
    query?: AssistantCloudThreadMessageListQuery
  ): Promise<AssistantCloudThreadMessageListResponse> {
    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      throw new Error('not in an electron window');
    }
    const state = (await window.electronAPI.getAppState()) as any;

    if (state.settings.path === undefined) {
      throw new Error('path not set');
    }

    const repoRootPath = state.settings.path;

    const threadOperationFilePath = `${repoRootPath}/.legit/branches/${threadId}/.legit/operationHistory`;
    const operationHistoryContent = await window.electronAPI.readFile(
      threadOperationFilePath,
      'utf-8'
    );

    console.log(operationHistoryContent);
    let messages: CloudMessage[] = [];

    if (operationHistoryContent !== '') {
      const parsedOperationContent = JSON.parse(
        operationHistoryContent
      ) as Operation[];

      for (const jsonOperation of parsedOperationContent) {
        let cloudMessageWithoutId: CloudMessageWithoutId;
        let composedMessage: CloudMessage;
        try {
          const [message, payload] =
            jsonOperation.message.split('----payload----\n');
          cloudMessageWithoutId = JSON.parse(
            payload
          ) satisfies CloudMessageWithoutId;

          composedMessage = {
            id: jsonOperation.oid,
            height: messages.length,
            parent_id:
              jsonOperation.parentOids[0] === jsonOperation.parentOids[1]
                ? null
                : jsonOperation.parentOids[0]!,
            ...cloudMessageWithoutId,
          };
          messages.push(composedMessage);
        } catch {
          console.log(
            'Skipping operation with invalid JSON message:',
            jsonOperation
          );
          continue;
        }
      }
    }

    // const result: AssistantCloudThreadMessageListResponse
    return {
      messages,
    };
  }

  public async create(
    threadId: string,
    body: AssistantCloudThreadMessageCreateBody
  ): Promise<AssistantCloudMessageCreateResponse> {
    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      throw new Error('not in an electron window');
    }
    const state = (await window.electronAPI.getAppState()) as any;

    if (state.settings.path === undefined) {
      throw new Error('path not set');
    }

    const repoRootPath = state.settings.path;

    try {
      const newMessageData: CloudMessageWithoutId = {
        // TODO also dont save created_at since we gain this from the commit date
        created_at: new Date(),
        // TODO open question when does a message update
        updated_at: new Date(),
        format: body.format,
        content: body.content,
      };

      let lastMessageText = '';
      if (body.content) {
        // If body.content is an object with a 'content' array property
        if (Array.isArray(body.content.content)) {
          for (let i = body.content.content.length - 1; i >= 0; i--) {
            const item = body.content.content[i];
            if (item.type === 'text' && typeof item.text === 'string') {
              lastMessageText = item.text;
              break;
            }
          }
        }
        // If body.content itself is an array
        else if (Array.isArray(body.content)) {
          for (let i = body.content.length - 1; i >= 0; i--) {
            const item = body.content[i];
            if (item.type === 'text' && typeof item.text === 'string') {
              lastMessageText = item.text;
              break;
            }
          }
        }
      }

      // TODO change the api to operation/commit to enforce using a specific commit as parent. this will allow us to use the parent_id from the body

      // TODO use .legit/branches instead - when the settings is set correctly
      const threadOperationFilePath = `${repoRootPath}/.legit/branches/${threadId}/.legit/operation`;
      await window.electronAPI.writeFile(
        threadOperationFilePath,
        lastMessageText +
          '\n\n----payload----\n' +
          JSON.stringify(newMessageData),
        'utf-8'
      );

      // NOTE this is a n optimistic approach for now assuming we dont write another operation in a parallel
      const operationID = await window.electronAPI.readFile(
        threadOperationFilePath,
        'utf-8'
      );

      return {
        message_id: operationID, // Implement your logic to create a message here
      };

      // const hanlde = await window.electronAPI.openFile(operation)
      // handle.write("newoperation content")
      // handle.sync()
      // id = handle.read()

      // id 1
      // const id1 = await readFile('operation')

      // await window.electronAPI.writeFile(
      //   threadOperationFilePath,
      //   JSON.stringify(body),
      //   'utf-8'
      // );

      // // id 2
      // const id2 = await readFile('operation')
    } catch (err) {
      console.error('Failed to read branches directory:', err);
      throw err;
    }

    // const thread = threads.find(t => t.id === threadId);
    // if (thread) {
    //   const id = `msg-${Date.now()}`;
    //   const newMessage: CloudMessage = {
    //     id,
    //     parent_id: body.parent_id,
    //     height: thread.messages.length,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //     format: body.format,
    //     content: body.content,
    //   };
    //   thread.messages.push(newMessage);
    //   return {
    //     message_id: id, // Implement your logic to create a message here
    //   };
    // }

    // throw new Error('Thread not found');
  }
}
