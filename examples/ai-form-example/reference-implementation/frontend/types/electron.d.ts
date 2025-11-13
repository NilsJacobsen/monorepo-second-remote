interface MetaEntry {
  sessionId: string;
  messageId: string;
  role: string;
  message: string;
  date: string;
  commit: string | null;
}
interface Window {
  electronAPI?: {
    // Folder selection
    openFolder: () => Promise<void>;
    selectFolder: () => Promise<string | null>;

    // Tag management
    addMetaEntry: (metaEntry: MetaEntry) => Promise<void>;
    getTagsForSession: (sessionId: string) => Promise<void>;

    // App state management
    getAppState: () => Promise<unknown>;
    setAppState: (newState: unknown) => Promise<unknown>;
    getAppStateKey: (key: string) => Promise<unknown>;
    setAppStateKey: (key: string, value: unknown) => Promise<unknown>;

    // Persisted messages
    savePersistedMessages: (
      messages: Array<import('ai').Message>
    ) => Promise<{ success: true; filePath: string }>;
    loadPersistedMessages: () => Promise<Array<import('ai').Message>>;
    clearPersistedMessages: () => Promise<{ success: true; filePath: string }>;

    // Diff
    diff: (params: {
      files: string[];
      type?: 'full' | 'preview';
    }) => Promise<Record<string, string>>;
    readFile: (path: string, encoding?: string) => Promise<string>;
    writeFile: (path: string, data: string, encoding?: string) => Promise<void>;
    readDir: (
      path: string,
      options?: { withFileTypes?: boolean }
    ) => Promise<string[] | import('fs').Dirent[]>;

    mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  };
}
