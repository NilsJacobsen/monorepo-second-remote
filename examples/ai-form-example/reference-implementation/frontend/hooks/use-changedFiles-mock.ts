import { useState, useEffect, useCallback } from 'react';

// Event emitter for cross-component communication
class ChangedFilesEventEmitter {
  private listeners: Set<(files: string[]) => void> = new Set();

  subscribe(callback: (files: string[]) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(files: string[]) {
    this.listeners.forEach(callback => callback(files));
  }
}

// Event emitter for latest file changes tool timestamp
class LatestFileChangesToolEmitter {
  private listeners: Set<(timestamp: string) => void> = new Set();

  subscribe(callback: (timestamp: string) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(timestamp: string) {
    this.listeners.forEach(callback => callback(timestamp));
  }
}

// Global event emitter instances
const changedFilesEmitter = new ChangedFilesEventEmitter();
const latestFileChangesToolEmitter = new LatestFileChangesToolEmitter();

// Global state
let changedFiles: string[] = [];
let latestFileChangesToolTimestamp: string = '';

export const useChangedFilesMock = () => {
  const [files, setFiles] = useState<string[]>(changedFiles);

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = changedFilesEmitter.subscribe(newFiles => {
      setFiles([...newFiles]);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const appendFile = useCallback((filePath: string) => {
    if (!changedFiles.includes(filePath)) {
      changedFiles = [...changedFiles, filePath];
      changedFilesEmitter.emit(changedFiles);
    }
  }, []);

  const appendFiles = useCallback((filePaths: string[] | undefined | null) => {
    if (!filePaths || !Array.isArray(filePaths)) {
      return;
    }

    const newFiles = filePaths.filter(
      filePath => !changedFiles.includes(filePath)
    );
    if (newFiles.length > 0) {
      changedFiles = [...changedFiles, ...newFiles];
      changedFilesEmitter.emit(changedFiles);
    }
  }, []);

  const clearFiles = useCallback(() => {
    changedFiles = [];
    changedFilesEmitter.emit(changedFiles);
  }, []);

  const removeFile = useCallback((filePath: string) => {
    const index = changedFiles.indexOf(filePath);
    if (index > -1) {
      changedFiles = changedFiles.filter(f => f !== filePath);
      changedFilesEmitter.emit(changedFiles);
    }
  }, []);

  return {
    files,
    appendFile,
    appendFiles,
    clearFiles,
    removeFile,
  };
};

export const useLatestFileChangesTool = () => {
  const [latestTimestamp, setLatestTimestamp] = useState<string>(
    latestFileChangesToolTimestamp
  );

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = latestFileChangesToolEmitter.subscribe(timestamp => {
      setLatestTimestamp(timestamp);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const updateLatestTimestamp = useCallback((timestamp: string) => {
    latestFileChangesToolTimestamp = timestamp;
    latestFileChangesToolEmitter.emit(timestamp);
  }, []);

  return {
    latestTimestamp,
    updateLatestTimestamp,
  };
};

// Export the emitters for direct access if needed
export { changedFilesEmitter, latestFileChangesToolEmitter };
