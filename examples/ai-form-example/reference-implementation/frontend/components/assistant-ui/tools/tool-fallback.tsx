import { ToolCallContentPartComponent } from '@assistant-ui/react';
import { Ban, CheckIcon, LoaderCircle, PencilLineIcon } from 'lucide-react';
import getToolMapping from '@/app/api/chat/tool-mapping';
import { TIMELINE_INDICATOR_SIZE } from '../timeline';
import { TIMELINE_OFFSET } from '../timeline';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  result,
  status,
}) => {
  const toolMapping = getToolMapping(toolName);
  const circleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkVisibility = () => {
      if (!circleRef.current) return;
      const rect = circleRef.current.getBoundingClientRect();
      const { top, bottom } = rect;
      const buffer = 120;
      const viewportHeight = window.innerHeight;
      // Fade out if within 20px of top or bottom
      if (top < buffer || bottom > viewportHeight - buffer) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    // Run on mount
    checkVisibility();
    // Listen to scroll and resize
    window.addEventListener('scroll', checkVisibility, {
      passive: true,
      capture: true,
    });
    window.addEventListener('resize', checkVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkVisibility, true);
      window.removeEventListener('resize', checkVisibility);
    };
  }, []);

  return (
    <div className="relative flex items-center gap-2 px-2 py-2">
      {toolMapping && !toolMapping.readOnly && (
        <div
          className="changes-tool-indicator flex items-center absolute"
          id={`changes-tool-indicator-${result?.timestamp}`}
          style={{
            top: `${TIMELINE_INDICATOR_SIZE / 2}px`,
            left: `-${TIMELINE_OFFSET}px`,
          }}
        >
          <div
            ref={circleRef}
            className="w-6 h-6 border-6 border-background rounded-full bg-primary-accent flex items-center justify-center transition-opacity duration-20"
            style={{ opacity: isVisible ? 1 : 0 }}
          >
            <div className="w-[6px] h-[6px] bg-background rounded-full" />
          </div>
          <div
            className="border-t border-zinc-200 border-dashed"
            style={{
              width: `calc(${TIMELINE_OFFSET * 1.15}px - ${TIMELINE_INDICATOR_SIZE}px)`,
              opacity: isVisible ? 1 : 0,
            }}
          />
        </div>
      )}
      <div
        className={cn(
          'w-6 h-6 flex items-center justify-center gap-2 text-background rounded-full ml-1',
          toolMapping && toolMapping.readOnly ? 'bg-zinc-400' : 'bg-transparent'
        )}
      >
        {status.type === 'complete' &&
          (toolMapping && toolMapping.readOnly ? (
            <CheckIcon className="size-4" />
          ) : (
            <PencilLineIcon className="size-5 text-primary-accent" />
          ))}
        {status.type === 'incomplete' && <Ban className="size-4" />}
        {status.type === 'running' && (
          <LoaderCircle className="size-4 animate-spin" />
        )}
      </div>
      <p className="pl-1 flex items-center overflow-hidden">
        <b>{toolMapping ? toolMapping.displayName : toolName}</b>
      </p>
    </div>
  );
};
