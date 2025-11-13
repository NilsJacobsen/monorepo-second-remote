import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAssistantState,
  useLocalThreadRuntime,
  useThread,
  useThreadRuntime,
} from '@assistant-ui/react';
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { MarkdownText } from '@/components/assistant-ui/markdown-text';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import { ToolFallback } from './tools';
import { Timeline, CHAT_OFFSET } from './timeline';
import { useChangedFilesMock } from '@/hooks/use-changedFiles-mock';
import InitialDiff from './initial-diff';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { DialogHeader } from '../ui/dialog';
import { ApplyIllustration } from '../illustrations/apply';
import { Message } from 'ai';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';

async function addOperation(threadId: string, messageData: any) {
  if (!(typeof window !== 'undefined' && window.electronAPI)) {
    console.warn('not in an electron window');
    return;
  }
  const state = (await window.electronAPI.getAppState()) as any;

  if (state.settings.path === undefined) {
    console.log('no path set yet');
    return;
  }
  try {
    // TODO use .legit/branches instead - when the settings is set correctly
    const threadOperationFilePath = `${state.settings.path}/.legit/branches/${threadId}/.legit/operation`;
    await window.electronAPI.writeFile(
      threadOperationFilePath,
      JSON.stringify(messageData),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to read branches directory:', err);
    throw err;
  }
}

import {
  ComposerAttachments,
  ComposerAddAttachment,
  UserMessageAttachments,
} from '@/components/assistant-ui/attachment';

export const Thread: FC = () => {
  // const messages = useThread(m => m.messages);

  // console.log('Rendering Thread with messages:', messages);
  // const [operations, setOperations] = useState<Message[]>([]);

  const threadsState = useAssistantState(({ threads }) => threads);

  const threadItems = threadsState.threadItems;
  const threadId = threadsState.mainThreadId;

  const thread = threadItems.find(item => item.id === threadId);
  const remoteId = thread?.remoteId;

  if (typeof window !== 'undefined' && remoteId) {
    if ((window as any).threadContext === undefined) {
      (window as any).threadContext = { thread_id: 'not_set' };
    }
    // console.log('new thread id: ', remoteId, thread);
    (window as any).threadContext.thread_id = remoteId;
  }

  // Message finish hook - call addMetaEntry when a new message finishes
  // useEffect(() => {
  //   console.log('useEffect on operations: ', messages);
  //   const lastOperation = operations[operations.length - 1];
  //   if (lastOperation) {
  //     // Call the IPC addMetaEntry API
  //     if (threadId && typeof window !== 'undefined' && window.electronAPI) {
  //       const operationData = {
  //         sessionId: threadId, // You might want to get this from context
  //         messageId: lastOperation.id,
  //         role: lastOperation.role,
  //         message: lastOperation.content,
  //         date: new Date().toISOString(),
  //         commit: null, // Add commit info if available
  //       };

  //       addOperation(threadId, operationData);
  //     }
  //   }
  // }, [operations]);

  // useEffect(() => {
  //   console.log('useEffect on messages: ', messages);
  //   if (!messages || messages.length === 0) return;

  //   const messagesToProcess: Message[] = [];

  //   // filter out messages that doesn't have complete or no status
  //   for (const message of messages) {
  //     if (message.content && message.content.length > 0) {
  //       for (const content of message.content) {
  //         // Check if content has a status property and if it's complete or undefined
  //         const hasCompleteStatus =
  //           'status' in content &&
  //           ((content.status &&
  //             typeof content.status === 'object' &&
  //             'type' in content.status &&
  //             content.status.type === 'complete') ||
  //             !content.status);
  //         const hasNoStatus = !('status' in content);

  //         if (hasCompleteStatus || hasNoStatus) {
  //           messagesToProcess.push({
  //             id: message.id,
  //             role: message.role,
  //             createdAt: message.createdAt,
  //             content: JSON.stringify(content),
  //           });
  //         }
  //       }
  //     }
  //   }

  //   setOperations(prev =>
  //     prev.length !== messagesToProcess.length ? messagesToProcess : prev
  //   );
  // }, [messages]);

  return (
    <ThreadPrimitive.Root
      className="relative bg-background box-border flex h-[calc(100vh-64px)] flex-col overflow-hidden"
      style={{
        ['--thread-max-width' as string]: '42rem',
      }}
      id="thread-root"
    >
      <Timeline />
      <ThreadPrimitive.Viewport
        className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-4"
        id="thread-viewport"
      >
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <p className="mt-4 font-medium">How can I help you today?</p>
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="mt-3 flex w-full items-stretch justify-center gap-4">
      <ThreadPrimitive.Suggestion
        className="hover:bg-zinc-100 bg-background flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in z-10"
        prompt="List files."
        method="replace"
        autoSend
      >
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
          List files.
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
        prompt="Show me a file tree with max depth 2."
        method="replace"
        autoSend
      >
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
          Show file tree.
        </span>
      </ThreadPrimitive.Suggestion>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerWrapper>
      <ComposerPrimitive.Root className="flex w-full flex-wrap items-end rounded-b-lg bg-inherit px-2.5 transition-colors ease-in">
        <ComposerAttachments />
        <ComposerAddAttachment />
        <ComposerPrimitive.Input
          rows={1}
          autoFocus
          placeholder="Write a message..."
          className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    </ComposerWrapper>
  );
};

const ComposerWrapper: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { files } = useChangedFilesMock();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [diffsByFile, setDiffsByFile] = useState<Record<string, string>>({});

  const handleAnimationComplete = () => {
    // Find the viewport element and scroll to bottom
    setTimeout(() => {
      const viewport = document.getElementById(
        'thread-viewport'
      ) as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  };

  // Load diffs when expanded or files change
  useEffect(() => {
    let cancelled = false;
    const loadDiffs = async () => {
      try {
        if (!files || files.length === 0 || isCollapsed) {
          setDiffsByFile({});
          return;
        }
        const result = await window.electronAPI?.diff({ files });
        if (!cancelled) {
          setDiffsByFile(result || {});
        }
      } catch (err) {
        if (!cancelled) {
          setDiffsByFile({});
          // eslint-disable-next-line no-console
          console.error('Failed to load diffs:', err);
        }
      }
    };
    loadDiffs();
    return () => {
      cancelled = true;
    };
  }, [files, isCollapsed]);

  return (
    <div className="focus-within:border-zinc-400 flex w-full flex-wrap items-end rounded-lg border shadow-sm transition-colors ease-in bg-zinc-50 overflow-hidden">
      <AnimatePresence>
        {files && files.length > 0 && (
          <motion.div
            className="w-full"
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            onAnimationComplete={handleAnimationComplete}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
              height: { duration: 0.2 },
              opacity: { duration: 0.1, delay: 0.1 },
            }}
          >
            <div className="flex items-center gap-1 h-12 p-2 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronDownIcon />
              </Button>
              <h3 className="font-semibold text-sm">{`${files.length} files changed`}</h3>
              <ApplyOnOriginalDialog />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col gap-2 p-2 pt-0 w-full">
                {files &&
                  files.map(file => {
                    const file_name = file.split('/').pop();
                    return (
                      <InitialDiff
                        key={file}
                        file_name={file_name || ''}
                        diff={diffsByFile[file] || ''}
                      />
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={cn(
          'w-full bg-background rounded-b-lg',
          files && files.length > 0 && 'border-t'
        )}
      >
        {children}
      </div>
    </div>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const ApplyOnOriginalDialog: FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" className="ml-auto">
          <p className="font-semibold">Apply on original</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden">
        <div className="relative bg-zinc-100 w-full h-60 flex items-center justify-center">
          <ApplyIllustration width={360} />
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-zinc-100 via-zinc-100/50 to-transparent" />
        </div>
        <DialogHeader className="px-5 pt-3">
          <DialogTitle>Apply changes to original files</DialogTitle>
          <DialogDescription>
            Apply your changes to the original file. This will overwrite the
            original files with the changes the AI has made in that thread.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-1 px-5">
          <input
            type="checkbox"
            id="dont-show-again"
            className="rounded border-zinc-300"
          />
          <label htmlFor="dont-show-again" className="text-sm text-zinc-600">
            Don&apos;t show me again
          </label>
        </div>
        <div className="flex justify-end space-x-2 px-5 pb-5">
          <Button variant="outline">Cancel</Button>
          <Button variant="default">Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />
      <UserMessageAttachments />
      <div className="bg-muted text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 col-start-2 row-start-2">
        <MessagePrimitive.Content />
      </div>
      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root
      className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl"
      style={{ marginLeft: CHAT_OFFSET }}
    >
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <div
        className="text-foreground max-w-[calc(var(--thread-max-width)*0.7)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5"
        style={{ marginLeft: CHAT_OFFSET }}
      >
        <MessagePrimitive.Content
          components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }}
        />
      </div>

      <div></div>
      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground flex gap-1 col-start-3 row-start-2 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
      style={{ marginLeft: CHAT_OFFSET - 1 }}
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'text-muted-foreground inline-flex items-center text-xs',
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};
