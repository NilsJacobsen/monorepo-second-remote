'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Assistant } from './assistant';
import { ThreadMessage } from '@assistant-ui/react';
// import { ThreadProvider, useThreadContext } from '../contexts/ThreadContext';

export default function Home() {
  const [messages, setMessages] = useState<Array<import('ai').Message>>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    // <ThreadProvider>
    <Assistant />
    // </ThreadProvider>
  );
}
