'use client';

import { Button } from '@/components/ui/button';
import { Settings2, X, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const [folderPath, setFolderPath] = useState<string>('');

  const handleClose = () => {
    router.push('/');
  };

  const loadCurrentPath = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const state = await window.electronAPI.getAppState();
        setFolderPath(state.settings?.path || 'No folder selected');
      } catch (error) {
        console.error('Failed to load current path:', error);
      }
    }
  };

  const handleSelectFolder = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const selectedPath = await window.electronAPI.selectFolder();
        if (selectedPath) {
          await window.electronAPI.setAppStateKey('settings', {
            path: selectedPath,
          });
          setFolderPath(selectedPath);
        }
      } catch (error) {
        console.error('Failed to select folder:', error);
      }
    }
  };

  useEffect(() => {
    loadCurrentPath();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Folder Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Default Folder Path
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 bg-zinc-50 rounded-md border text-sm text-zinc-600">
                    {folderPath}
                  </div>
                  <Button
                    onClick={handleSelectFolder}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    Select Folder
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  This folder will be accessable for AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
