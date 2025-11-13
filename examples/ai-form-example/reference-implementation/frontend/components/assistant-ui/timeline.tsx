import { FC, useEffect, useRef, useState } from 'react';
import { useThread } from '@assistant-ui/react';
import { Badge } from '@/components/ui/badge';

export const TIMELINE_OFFSET = 44;
export const TIMELINE_INDICATOR_SIZE = 24;
export const CHAT_OFFSET = 80;

export const Timeline: FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const messages = useThread(m => m.messages);
  const lastHeightRef = useRef<number>(0);
  const [indicatorsOutOfView, setIndicatorsOutOfView] = useState<number>(0);

  const updateTimeline = () => {
    if (!timelineRef.current) return;

    // Get all changes-tool-indicator elements
    const indicators = document.querySelectorAll('.changes-tool-indicator');

    if (indicators.length < 1) {
      // Hide timeline if there are no indicators
      timelineRef.current.style.display = 'none';
      setIndicatorsOutOfView(0);
      return;
    }

    const firstIndicator = indicators[0] as HTMLElement;
    const lastIndicator = indicators[indicators.length - 1] as HTMLElement;

    // Check if elements are actually visible and positioned
    if (!firstIndicator || !lastIndicator) {
      timelineRef.current.style.display = 'none';
      setIndicatorsOutOfView(0);
      return;
    }

    // Find the target parent element
    const targetParent =
      document.getElementById('thread-root') ||
      timelineRef.current.parentElement;

    if (!targetParent) {
      console.error('Could not find target parent element');
      timelineRef.current.style.display = 'none';
      setIndicatorsOutOfView(0);
      return;
    }

    // Get positions relative to the target parent
    const firstRect = firstIndicator.getBoundingClientRect();
    const lastRect = lastIndicator.getBoundingClientRect();
    const parentRect = targetParent.getBoundingClientRect();

    // Calculate positions relative to the target parent
    // const firstOffsetFromParent = firstRect.top - parentRect.top;
    const lastOffsetFromParent = lastRect.top - parentRect.top;
    const firstHeight = firstRect.height;
    const lastHeight = lastRect.height;

    // Validate that elements have actual height
    if (firstHeight === 0 || lastHeight === 0) {
      timelineRef.current.style.display = 'none';
      setIndicatorsOutOfView(0);
      return;
    }

    // Calculate center positions of the indicators relative to the parent
    // const startY = firstOffsetFromParent + firstHeight / 2;
    const endY = lastOffsetFromParent + lastHeight / 2;

    // const bottoms = Array.from(indicators).map(indicator => {
    //   const rect = (indicator as HTMLElement).getBoundingClientRect();
    //   return rect.bottom;
    // });

    // console.log(bottoms);

    // Count how many indicators are out of view
    let outOfViewCount = 0;
    indicators.forEach(indicator => {
      const rect = (indicator as HTMLElement).getBoundingClientRect();
      if (rect.bottom < 144) {
        outOfViewCount++;
      }
    });
    setIndicatorsOutOfView(outOfViewCount);
    // if (indicatorsOutOfView !== outOfViewCount) {
    //   setIndicatorsOutOfView(outOfViewCount);
    // }

    const timelineTop = 32;

    // Calculate new height
    const newHeight = endY - timelineTop;

    // Only update if height actually changed (to avoid unnecessary re-renders)
    if (Math.abs(newHeight - lastHeightRef.current) > 1) {
      // Update timeline position and height
      timelineRef.current.style.top = `${timelineTop}px`;
      timelineRef.current.style.height = `${newHeight < 40 ? 40 : newHeight}px`;
      timelineRef.current.style.display = 'block';

      // Store the new height
      lastHeightRef.current = newHeight;
    }
  };

  useEffect(() => {
    updateTimeline();

    // Add resize event listener
    const handleResize = () => {
      updateTimeline();
    };

    window.addEventListener('resize', handleResize);

    // TODO: Simple interval to check for height changes -> make more sophisticated
    const intervalId = setInterval(() => {
      updateTimeline();
    }, 50); // Check every 100ms

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, [messages.length]);

  return (
    <div className="absolute top-0 left-0 w-full h-full px-4 pointer-events-none">
      <div className="relative max-w-[var(--thread-max-width)] mx-auto h-full">
        <div
          className={`fixed top-16 h-[calc(100%_-_64px)] border-zinc-300 border-dashed border-r w-px translate-x-[22px]`}
        />
        <div className={`fixed top-16 h-12 w-10 ml-0.5 z-20`}>
          <div className="relative flex items-center justify-center h-full w-full">
            <div className="w-5 h-12 pt-4.5 flex items-center justify-center bg-background">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-accent"></div>
            </div>
            {indicatorsOutOfView > 0 && (
              <>
                <div className="w-6 h-6 absolute top-0 left-0 translate-x-[33px] translate-y-[54px]">
                  <div className="w-full h-full flex flex-col items-center justify-center bg-background rounded-full z-10">
                    <div className="-mb-[5px] w-2.5 h-2.5 bg-primary-accent/50 rounded-full" />
                    <div className="relative w-3 h-3 outline-2 outline-background rounded-full bg-primary-accent flex items-center justify-center z-10">
                      <div className="w-[6px] h-[6px] bg-background rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 translate-y-[54px] -translate-x-1/2">
                  <Badge className="px-1.5">{indicatorsOutOfView}</Badge>
                </div>
              </>
            )}
          </div>
        </div>
        <div
          ref={timelineRef}
          className={`absolute border-zinc-800 border-t border-r rounded-tr-xl w-6`}
          style={{
            display: 'none',
            transform: `translateX(${24}px)`,
          }}
        />
      </div>
    </div>
  );
};
