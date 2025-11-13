'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThread,
  useThreadListItemRuntime,
  useAssistantState,
  useAssistantApi,
} from '@assistant-ui/react';
import {
  ArchiveIcon,
  PlusIcon,
  MoreHorizontalIcon,
  MessageSquareIcon,
  ClockIcon,
  TrashIcon,
  EditIcon,
  Settings2,
  Search,
  History,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const ThreadList: FC<{ collapsed?: boolean }> = ({
  collapsed = false,
}) => {
  if (collapsed) {
    return <ThreadListCollapsed />;
  }
  return <ThreadListExpanded />;
};

const ThreadListCollapsed: FC = () => {
  const api = useAssistantApi();

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Button
          className="w-full px-2 py-2"
          variant="outline"
          size="sm"
          onClick={() => {
            api.threads().switchToNewThread();
          }}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <ThreadListItems collapsed={true} />
      </div>

      <div className="border-t p-2">
        <Link href="/settings">
          <Button className="w-full px-2 py-2" variant="ghost" size="sm">
            <Settings2 className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const ThreadListExpanded: FC = () => {
  const api = useAssistantApi();

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Button
          className="w-full justify-start gap-2 h-8"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Creating new thread');
            api.threads().switchToNewThread();
          }}
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <ThreadListItems collapsed={false} />
      </div>

      <div className="border-t p-2">
        <div className="text-m text-muted-foreground flex flex-col justify-items-start gap-2">
          <Link href="/settings">
            <Button
              className="w-full justify-start gap-2 h-8"
              variant="ghost"
              size="sm"
            >
              <Settings2 />
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const ThreadListItems: FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const threadsState = useAssistantState(({ threads }) => threads);
  const api = useAssistantApi();

  const threadItems = threadsState.threadItems;
  const threadId = threadsState.mainThreadId;

  return (
    <div className="flex flex-col gap-1">
      {threadItems
        .filter(thread => thread.status !== 'new' && thread.title !== undefined)
        .map(thread => (
          <ThreadItem
            key={thread.id}
            threadTitle={thread.title ?? 'new Message'}
            isActive={thread.id === threadId}
            collapsed={collapsed}
            onSelect={() => {
              api.threads().switchToThread(thread.id);
            }}
            onDelete={() => {
              api.threads().item({ id: thread.id }).delete();
            }}
          />
        ))}
    </div>
  );
};

const ThreadItem: FC<{
  threadTitle: string;
  isActive: boolean;
  collapsed: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ threadTitle, isActive, collapsed, onSelect, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (collapsed) {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-2 rounded-lg transition-all cursor-pointer',
          'hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          isActive && 'bg-primary/10 border border-primary-accent shadow-sm'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
      >
        <div className="flex-grow px-2 py-2 text-start min-w-0">
          <div className="flex items-center justify-center">
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-lg transition-all cursor-pointer',
        'hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        isActive && 'bg-primary/10 border border-primary-accent shadow-sm'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="flex-grow px-3 py-2 text-start min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquareIcon
              className={cn(
                'h-3 w-3 flex-shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <p
              className={cn(
                'text-sm font-medium truncate',
                isActive ? 'text-primary' : 'text-foreground'
              )}
            >
              {threadTitle}
            </p>
            {/* <div className="flex items-center gap-1 ml-auto">
              <ClockIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTime(thread.lastMessageAt)}
              </span>
            </div> */}
          </div>
          {/* <p className="text-xs text-muted-foreground truncate">
            {thread.messages.length > 0
              ? `${thread.messages.length} messages`
              : 'No messages yet'}
          </p> */}
        </div>
      </div>

      {isHovered && (
        <div className="flex items-center gap-1 pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
