// Implement your custom adapter with proper message persistence
const myDatabaseAdapter: RemoteThreadListAdapter = {
  async list() {
    const result: RemoteThreadListResponse = {
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

        result.threads.push({
          title: branchName as string,
          remoteId: branchName,
          status: 'regular',
        });
      }
    } catch (err) {
      console.error('Failed to read branches directory:', err);
    }

    return result;
  },
  async initialize(tempThreadId) {
    const threadId = `legit-thread-${tempThreadId}`;
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
      await window.electronAPI.mkdir(newBranchPath);
    } catch (err) {
      console.error('Failed to read branches directory:', err);
      throw err;
    }

    return { remoteId: threadId, externalId: undefined };
  },

  async rename(remoteId, newTitle) {
    return;
  },
  async archive(remoteId) {
    return;
  },
  async unarchive(remoteId) {
    return;
  },
  async delete(remoteId) {
    // Delete thread and its messages
    return;
  },
  async generateTitle(remoteId, messages) {
    // // Generate title from messages using your AI
    // const newTitle = await generateTitle(messages);
    // // Persist the title in your DB
    // await db.threads.update(remoteId, { title: newTitle });
    // // IMPORTANT: Return an AssistantStream so the UI updates
    // return createAssistantStream(controller => {
    //   controller.appendText(newTitle);
    //   controller.close();
    // });
    return {} as any;
  },
};
