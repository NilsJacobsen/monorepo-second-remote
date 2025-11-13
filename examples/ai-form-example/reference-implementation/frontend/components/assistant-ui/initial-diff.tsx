'use client';

import { ChevronsUpDown, File } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useState } from 'react';

const DOWNLOAD_BUTTON_SIZE = 'w-11';

const InitialDiff = ({
  file_name,
  diff,
}: {
  file_name: string;
  diff: string;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Helper to trigger download of a file in the public directory
  const handleDownload = (version: 'old' | 'new') => {
    const fileMap = {
      old: 'accounting_july2025_old.xlsx',
      new: 'accounting_july2025_new.xlsx',
    };
    const fileUrl = `/${fileMap[version]}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileMap[version];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex items-center justify-center text-zinc-600">
          <File className="size-4" />
        </div>
        <p className="text-zinc-600">{file_name}</p>
        <div className="flex gap-1 ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={DOWNLOAD_BUTTON_SIZE}
                onClick={() =>
                  file_name === 'accounting_july2025.xlsx' &&
                  handleDownload('old')
                }
              >
                old
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download old</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={DOWNLOAD_BUTTON_SIZE}
                onClick={() =>
                  file_name === 'accounting_july2025.xlsx' &&
                  handleDownload('new')
                }
              >
                new
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download new</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* <div
        className="relative p-3 bg-zinc-100 mt-1 rounded-md overflow-hidden border border-zinc-200"
        style={{
          maxHeight: isCollapsed ? '100px' : 'none',
        }}
      >
        <p className="text-sm text-zinc-600 pb-2 mt-[-10px]">...</p>
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: diff }} />
        <p className="text-sm text-zinc-600 pt-2 pb-6">...</p>
        <div
          className="group absolute bottom-0 left-0 cursor-pointer w-full h-6 flex items-center justify-center font-medium bg-white/60 hover:bg-white/90 transition-all duration-200"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronsUpDown className="group-hover:opacity-100 opacity-0 transition-all duration-200 size-4" />
        </div>
      </div> */}
    </div>
  );
};

export default InitialDiff;
