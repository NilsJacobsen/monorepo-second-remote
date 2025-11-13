import { tool } from '@assistant-ui/react';
import { z } from 'zod';
export const systemPrompt = `
You are a helpful assistant that specializes in organizing and managing files on a computer, with special expertise in document editing through MCP tools.

## CORE WORKFLOW:
1. Call the \`think\` tool to break down the user's request into steps
2. Summarize your plan for the user to keep them informed
3. Execute each step using appropriate tools
4. When finished, provide a brief summary of what was accomplished

## CRITICAL RULES:
- **ALWAYS provide a summary at the end** - explain what you did in 1-2 sentences
- **Only call \`show_file_changes\` if files were actually modified, created, or deleted**
- **If no files were changed, provide a direct summary without calling \`show_file_changes\`**
- **After calling \`show_file_changes\`, you MUST provide a summary**

## COMMUNICATION REQUIREMENTS:
- Always explain your reasoning before taking actions
- Always tell the user what you want to do and why BEFORE you do it
- Report progress after each significant step
- If something unexpected happens, explain what went wrong and how you'll handle it
- Keep the user informed about what you're doing and why

## SUMMARY REQUIREMENT:
After completing any task, you MUST provide a brief summary explaining what was accomplished. This is non-negotiable.

Examples of good summaries:
- "I analyzed the invoice and extracted the key financial data including amount, date, and vendor information."
- "I organized the documents into appropriate folders and cleaned up duplicate files."
- "I found the missing file in the downloads folder and moved it to the correct location."

You help users with everyday file management tasks such as:
- Organizing documents, photos, and other files into logical folders
- Finding lost or misplaced files
- Cleaning up cluttered directories and removing duplicate files
- Creating backup strategies for important documents
- Renaming files to follow consistent naming conventions
- Understanding file types and their uses
- Managing downloads and desktop organization
- Sorting files by date, size, or category
- Creating folder structures that make sense for the user's workflow
- Editing and formatting Word documents, spreadsheets, and other files
- Creating professional documents with proper structure and formatting

When working with documents:
- Use MCP tools for file operations and document editing
- Create well-structured documents with proper headings and formatting
- Ensure documents are saved in appropriate locations
- Verify document content meets user requirements

Be patient, thorough, and always explain things in plain language that anyone can understand.

**REMEMBER: ALWAYS provide a \`show_file_changes\` tool call and a summary at the end of every task.**
`;

export const tools: Record<string, ReturnType<typeof tool>> = {
  think: {
    description: `Reflects on the user task and creates a step-by-step plan before taking action.`,
    parameters: z.object({
      task: z.string().describe(`The task to be broken down into steps.`),
    }),
    execute: async ({ task }) => {
      // console.log(task);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:13617'}/api/tools/think`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task }),
        }
      );
      const data = await response.json();
      // console.log(data);
      return data;
    },
  },
  // validate_step: {
  //   description: `Validates whether a step was completed successfully and tracks progress.`,
  //   parameters: z.object({
  //     step_number: z.number().describe(`The step number being validated.`),
  //     step_description: z
  //       .string()
  //       .describe(`Description of what the step was supposed to do.`),
  //     result: z
  //       .string()
  //       .describe(`What actually happened when the step was executed.`),
  //     success: z.boolean().describe(`Whether the step was successful.`),
  //     next_action: z
  //       .string()
  //       .optional()
  //       .describe(`What to do next if the step failed or needs adjustment.`),
  //   }),
  //   execute: async ({
  //     step_number,
  //     step_description,
  //     result,
  //     success,
  //     next_action,
  //   }) => {
  //     const validation = {
  //       step_number,
  //       step_description,
  //       result,
  //       success,
  //       timestamp: new Date().toISOString(),
  //       next_action:
  //         next_action ||
  //         (success ? 'Proceed to next step' : 'Retry or adjust approach'),
  //     };

  //     console.log('Step validation:', validation);

  //     return {
  //       message: success
  //         ? `Step ${step_number} completed successfully: ${step_description}`
  //         : `Step ${step_number} needs attention: ${step_description}. Issue: ${result}. Suggestion: ${next_action}`,
  //       validation,
  //     };
  //   },
  // },
  analyze_document_image: {
    description: `Analyzes a document image and returns the text content of the document as json.`,
    parameters: z.object({
      image_path: z.string().describe(`The path to the image file.`),
    }),
    execute: async ({ image_path }) => {
      // we mock this for now
      // get image name from path
      const image_name = (image_path as string).split('/').pop();
      // get text from image
      switch (image_name) {
        case 'google_invoice_july.png':
          return {
            content: {
              number: '5264230960',
              date: '2025-07-29',
              issuer: 'Google Cloud EMEA Limited',
              amount: 82.8,
            },
          };
        case 'regus_invoice_july.png':
          return {
            content: {
              number: '1237-2025-1016INV',
              date: '2025-07-30',
              issuer: 'Regus Management GmbH',
              amount: 639.03,
            },
          };
        case 'uber_invoice_july.png':
          return {
            content: {
              number: 'Receipt_31July2025_080650',
              date: '2025-07-31',
              issuer: 'DynamicFuture Berlin GmbH (Uber)',
              amount: 23.96,
            },
          };
        default:
          return 'Error while analyzing document image';
      }
    },
  },
  show_file_changes: {
    description: `Shows all file changes and diffs that occurred during the task execution. ONLY call this tool if files were actually created, modified, or deleted during the task. If no files were changed, provide a direct summary instead.`,
    parameters: z.object({
      changed_files: z
        .array(z.string())
        .describe(
          `A list of all files that were created, modified, or deleted. This must not be empty - only call this tool if there are actual file changes.`
        ),
      short_title: z
        .string()
        .describe(
          `A short title for the task that was executed. This will be displayed in the UI. 3 or 4 words max.`
        ),
    }),
    execute: async ({ changed_files, short_title }) => {
      console.log('File changes detected:', { changed_files, short_title });
      return {
        message: `Task completed: ${short_title}`,
        changed_files,
        short_title,
        timestamp: new Date().toISOString(),
      };
    },
  },
};
