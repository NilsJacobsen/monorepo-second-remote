import { azure } from '@ai-sdk/azure';
import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { streamText } from 'ai';
import { streamTextToDataStreamResponse } from '@/lib/streamTextToDataStream';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const payload = await req.json();
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const system = payload?.system;
  const tools = payload?.tools;

  console.log('messages', JSON.stringify(messages, null, 2));

  try {
    const result = streamText({
      model: azure('gpt-4o'),
      messages,
      system,
      tools: {
        ...frontendTools(tools ?? {}),
      },
      onError: console.error,
      onFinish: () => console.log('Stream finished cleanly'),
    });

    // TODO: This is a temporary solution to get the data stream response.
    return streamTextToDataStreamResponse(result);
  } catch (error) {
    console.error('Failed to stream chat response', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
