import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { makeAssistantToolUI } from '@assistant-ui/react';
import { ChevronDown } from 'lucide-react';
import InitialDiff from '../initial-diff';
import { useEffect, useState, useRef } from 'react';
import { useChangedFilesMock } from '@/hooks/use-changedFiles-mock';

type ShowFileChangesArgs = {
  changed_files: string[];
  short_title: string;
};

type ShowFileChangesResult = {
  short_title: string;
  changed_files: string[];
  timestamp: string;
};

export const ShowFileChangesToolUI = makeAssistantToolUI<
  ShowFileChangesArgs,
  ShowFileChangesResult
>({
  toolName: 'show_file_changes',
  render: ({ args, result }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLatest, setIsLatest] = useState(true);
    const [diff, setDiff] = useState<any | null>(null);
    const [wasLatest, setWasLatest] = useState(true);
    const elementRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const { appendFiles } = useChangedFilesMock();

    useEffect(() => {
      appendFiles(args.changed_files);
    }, [args.changed_files]);

    useEffect(() => {
      const checkIfLatest = () => {
        if (elementRef.current) {
          const allFileChangeTools =
            document.querySelectorAll('.file-changes-tool');
          const isLastElement =
            elementRef.current ===
            allFileChangeTools[allFileChangeTools.length - 1];

          // Only auto-collapse when transitioning from latest to not-latest
          if (wasLatest && !isLastElement && !isCollapsed) {
            setIsCollapsed(true);
          }

          setWasLatest(isLastElement);
          setIsLatest(isLastElement);
        }
      };

      // Check immediately
      checkIfLatest();

      // Check periodically
      const intervalId = setInterval(checkIfLatest, 500);

      return () => clearInterval(intervalId);
    }, [wasLatest, isCollapsed]);

    useEffect(() => {
      const fetchDiff = async () => {
        const diff = await window.electronAPI?.diff({
          files: args.changed_files,
        });
        setDiff(diff);
      };

      fetchDiff();
    }, [args.changed_files]);

    return (
      <div
        ref={elementRef}
        className="file-changes-tool rounded-lg border border-zinc-200 my-6 overflow-hidden"
        id={`file-changes-tool-${result?.timestamp ? new Date(result.timestamp).getTime() : undefined}`}
      >
        <div className="relative flex items-center gap-2 h-12 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronDown
              className="size-4 transition-transform duration-200"
              style={{
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            />
          </Button>
          <h3 className="font-bold">{'File changes'}</h3>
          {isLatest ? (
            <Badge variant="outline" className="ml-auto h-7">
              Current
            </Badge>
          ) : (
            <Button variant="default" size="sm" className="ml-auto">
              Restore
            </Button>
          )}
        </div>
        <div
          ref={contentRef}
          className="transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isCollapsed ? '0px' : 'none',
            opacity: isCollapsed ? 0 : 1,
            paddingTop: isCollapsed ? '0px' : '8px',
            paddingBottom: isCollapsed ? '0px' : '8px',
            paddingLeft: isCollapsed ? '0px' : '8px',
            paddingRight: isCollapsed ? '0px' : '8px',
          }}
        >
          <div className="flex flex-col gap-6">
            {diff &&
              Object.keys(diff).length > 0 &&
              Object.keys(diff).map(file => {
                console.log('file', diff);
                const file_name = file.split('/').pop();
                return (
                  <InitialDiff
                    key={file}
                    file_name={file_name || ''}
                    diff={diff[file] || ''}
                  />
                );
              })}
          </div>
        </div>
      </div>
    );
  },
});
