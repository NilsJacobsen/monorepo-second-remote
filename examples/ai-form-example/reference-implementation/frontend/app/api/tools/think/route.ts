import { openai } from '@ai-sdk/openai';
import { azure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { task } = await req.json();

    // Use streamText like in the main chat route
    const { textStream } = await streamText({
      model: process.env.OPENAI_API_KEY ? openai('gpt-4o') : azure('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: `You are an expert task planner. Break down complex tasks into clear, actionable steps.

IMPORTANT: Your response must be structured as follows:
1. First, briefly understand the task
2. Then provide numbered steps (1, 2, 3, etc.) that are:
   - Specific and actionable
   - Clear about what tool or action to take
   - Include expected outcomes
   - Account for potential errors or edge cases

For document editing tasks, consider using MCP tools like:
- File operations (create, read, write, delete files)
- Document editing (add content, format, structure)
- Directory operations (list, navigate, create folders)

Format your response like this:
UNDERSTANDING: [brief task analysis]
STEPS:
1. [specific action with tool/command - be explicit about which MCP tool to use]
2. [specific action with tool/command]
3. [specific action with tool/command]
...

Each step should be concrete enough that an agent can execute it immediately. For document tasks, specify the exact MCP tool and parameters needed.`,
        },
        {
          role: 'user',
          content: `Please break down this task into actionable steps: ${task}`,
        },
      ],
      maxSteps: 10,
    });

    // Properly consume the stream
    let steps = '';
    for await (const chunk of textStream) {
      steps += chunk;
    }

    return NextResponse.json({
      steps,
      task: task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in think route:', error);
    return NextResponse.json(
      { error: 'Failed to process thinking task' },
      { status: 500 }
    );
  }
}
