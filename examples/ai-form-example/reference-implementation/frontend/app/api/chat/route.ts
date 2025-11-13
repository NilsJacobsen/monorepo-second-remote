import { openai } from '@ai-sdk/openai';
import { azure } from '@ai-sdk/azure';
import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { streamText } from 'ai';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { tools as backendTools, systemPrompt } from './agents/main';
export const runtime = 'edge';
export const maxDuration = 30;

let mcpClientPromise: Promise<{
  wordClient: any;
  excelClient: any;
  filesystemClient: any;
  tools: any;
}> | null = null;

async function getMCPTools() {
  if (mcpClientPromise === null) {
    mcpClientPromise = (async () => {
      try {
        // Connect to Word MCP server
        const wordClient = await createMCPClient({
          transport: {
            type: 'sse',
            url: 'http://localhost:8002/sse',
          },
        });

        // Connect to Excel MCP server
        const excelClient = await createMCPClient({
          transport: {
            type: 'sse',
            url: 'http://localhost:8001/sse',
          },
        });

        // Connect to Filesystem MCP server
        const filesystemClient = await createMCPClient({
          transport: {
            type: 'sse',
            url: 'http://localhost:3001/sse',
          },
        });

        // Get tools from all three servers
        const [wordTools, excelTools, filesystemTools] = await Promise.all([
          wordClient.tools().catch(error => {
            console.warn('Failed to get Word MCP tools:', error);
            return {};
          }),
          excelClient.tools().catch(error => {
            console.warn('Failed to get Excel MCP tools:', error);
            return {};
          }),
          filesystemClient.tools().catch(error => {
            console.warn('Failed to get Filesystem MCP tools:', error);
            return {};
          }),
        ]);

        // Combine tools from all three servers
        const combinedTools = {
          ...wordTools,
          ...excelTools,
          ...filesystemTools,
        };

        return {
          wordClient,
          excelClient,
          filesystemClient,
          tools: combinedTools,
        };
      } catch (error) {
        console.warn('Failed to connect to MCP servers:', error);
        return {
          wordClient: null,
          excelClient: null,
          filesystemClient: null,
          tools: {},
        };
      }
    })();
  }
  return await mcpClientPromise;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { messages, system, tools, currentWorkingDirectory } = json;
  // console.log(messages, system, tools);
  console.log('INFORMATION ------ \n\n', json);

  const {
    wordClient,
    excelClient,
    filesystemClient,
    tools: currentMCPTools,
  } = await getMCPTools();

  // Add current working directory context to system prompt

  const threadId = req.headers.get('thread_id');
  const workingDirectoryContext =
    'Important: Your current working directory is: ~/gitbox/.legit/branches/' +
    threadId +
    ' all file operations the user is requesting are meant to be relative from this.' +
    ' so if the user asks to list files without specifying the directory and the context doesnt provide other informations use' +
    '~/gitbox/.legit/branches/' +
    threadId +
    ' as the base path.';

  console.log('PROMPT: ', workingDirectoryContext);

  const result = streamText({
    model: process.env.OPENAI_API_KEY ? openai('gpt-4o') : azure('gpt-4o'),
    messages,
    system: `${systemPrompt}${workingDirectoryContext}\n${system}`,
    tools: {
      ...frontendTools(tools),
      ...backendTools,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(currentMCPTools as any),
    },
    onError: console.log,
    maxSteps: 30,
  });

  return result.toDataStreamResponse();
}
