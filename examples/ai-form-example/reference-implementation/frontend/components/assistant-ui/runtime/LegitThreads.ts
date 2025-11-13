import { LegitThreadMessages, threads } from './LegitThreadMessages';
import {
  AssistantCloudThreads,
  AssistantCloudThreadMessages,
  AssistantCloudAPI,
  AssistantCloudThreadsListQuery,
  AssistantCloudThreadsListResponse,
  AssistantCloudThreadsCreateBody,
  AssistantCloudThreadsCreateResponse,
  AssistantCloudThreadsUpdateBody,
} from './types';

// @ts-expect-error

export class LegitThreads implements AssistantCloudThreads {
  public readonly messages: AssistantCloudThreadMessages;

  constructor(private cloud: AssistantCloudAPI) {
    // @ts-expect-error
    this.messages = new LegitThreadMessages(cloud);
  }

  public async list(
    query?: AssistantCloudThreadsListQuery
  ): Promise<AssistantCloudThreadsListResponse> {
    const result: AssistantCloudThreadsListResponse = {
      threads: [],
    };

    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      console.warn('not in an electron window');
      return result;
    }

    const state = (await window.electronAPI.getAppState()) as any;

    if (state.settings.path === undefined) {
      console.log('no path set yet');
      return result;
    }

    try {
      // TODO use .legit/branches instead - when the settings is set correctly
      const dirPath = `${state.settings.path}/.legit/branches`;
      const branchFolders = (await window.electronAPI.readDir(
        dirPath
      )) as string[];
      console.log('Branch files:', branchFolders);

      for (const branchName of branchFolders) {
        if (
          !branchName.startsWith('legit-thread-') ||
          branchName.endsWith('-operation')
        ) {
          continue;
        }

        const threadName = await window.electronAPI.readFile(
          `${state.settings.path}/.legit/branches/${branchName}/.legit/threadName`,
          'utf-8'
        );

        result.threads.push({
          title: threadName !== '' ? threadName : 'no name',
          last_message_at: new Date(), // TODO replace with last commit date
          metadata: {},
          external_id: null,
          id: branchName,

          project_id: '',
          created_at: new Date(),
          updated_at: new Date(),
          workspace_id: '',
          is_archived: false,
        });
      }
    } catch (err) {
      console.error('Failed to read branches directory:', err);
    }

    return result;
  }

  public async create(
    body: AssistantCloudThreadsCreateBody
  ): Promise<AssistantCloudThreadsCreateResponse> {
    const threadId = `legit-thread-${Date.now()}`;
    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      throw new Error('not in an electron window');
    }

    const state = (await window.electronAPI.getAppState()) as any;

    if (state.settings.path === undefined) {
      console.log('no path set yet');
      throw new Error('no path set yet');
    }
    try {
      // TODO use .legit/branches instead - when the settings is set correctly
      const newBranchPath = `${state.settings.path}/.legit/branches/${threadId}`;

      if (typeof window !== 'undefined') {
        if ((window as any).threadContext === undefined) {
          (window as any).threadContext = { thread_id: 'not_set' };
        }
        (window as any).threadContext.thread_id = threadId;
      }
      await window.electronAPI.mkdir(newBranchPath);
    } catch (err) {
      console.error('Failed to read branches directory:', err);
      throw err;
    }

    return {
      thread_id: threadId,
    };
  }

  public async update(
    threadId: string,
    body: AssistantCloudThreadsUpdateBody
  ): Promise<void> {
    if (!(typeof window !== 'undefined' && window.electronAPI)) {
      throw new Error('not in an electron window');
    }

    const state = (await window.electronAPI.getAppState()) as any;

    const branchPath = `${state.settings.path}/.legit/branches/${threadId}`;

    await window.electronAPI.writeFile(
      branchPath + '/.legit/threadName',
      body.title || ''
    );

    await window.electronAPI.writeFile(
      branchPath + '/.legit/threadName',
      body.title || ''
    );

    return;
  }

  public async delete(threadId: string): Promise<void> {
    return;
  }
}
