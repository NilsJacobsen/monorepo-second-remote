import type { StreamTextResult } from 'ai';
import {
  createAssistantStreamController,
  type AssistantStreamController,
} from 'assistant-stream';
import { DataStreamEncoder } from 'assistant-stream';
import { AssistantStream } from 'assistant-stream';

/**
 * Converts a streamText result to a Data Stream Response for use with useDataStreamRuntime
 */
export async function streamTextToDataStreamResponse(
  result: StreamTextResult<any, never>
): Promise<Response> {
  const [assistantStream, controller] = createAssistantStreamController();

  // Process the stream asynchronously
  (async () => {
    try {
      let textController: ReturnType<
        AssistantStreamController['addTextPart']
      > | null = null;
      const toolCallControllers = new Map<
        string,
        ReturnType<AssistantStreamController['addToolCallPart']>
      >();

      for await (const part of result.fullStream) {
        switch (part.type) {
          case 'text-start':
            textController = controller.addTextPart();
            break;

          case 'text-delta':
            if (!textController) {
              textController = controller.addTextPart();
            }
            textController.append(part.text);
            break;

          case 'text-end':
            textController?.close();
            textController = null;
            break;

          case 'tool-input-start': {
            const toolCallId = part.id;
            if (!toolCallControllers.has(toolCallId)) {
              const toolCallController = controller.addToolCallPart({
                toolCallId,
                toolName: part.toolName,
              });
              toolCallControllers.set(toolCallId, toolCallController);
            }
            break;
          }

          case 'tool-input-delta': {
            const toolCallId = part.id;
            const toolCallController = toolCallControllers.get(toolCallId);
            if (toolCallController) {
              toolCallController.argsText.append(part.delta);
            }
            break;
          }

          case 'tool-input-end': {
            const toolCallId = part.id;
            const toolCallController = toolCallControllers.get(toolCallId);
            if (toolCallController) {
              toolCallController.argsText.close();
            }
            break;
          }

          case 'tool-call': {
            const toolCallId = part.toolCallId;
            const existingController = toolCallControllers.get(toolCallId);

            if (!existingController) {
              const toolCallController = controller.addToolCallPart({
                toolCallId,
                toolName: part.toolName,
                args: part.input as any,
              });
              toolCallControllers.set(toolCallId, toolCallController);
            }
            break;
          }

          case 'tool-result': {
            const toolCallId = part.toolCallId;
            const toolCallController = toolCallControllers.get(toolCallId);

            if (toolCallController) {
              toolCallController.setResponse({
                result: part.output as any,
                isError: false,
              });
            }
            break;
          }

          case 'tool-error': {
            const toolCallId = part.toolCallId;
            const toolCallController = toolCallControllers.get(toolCallId);

            if (toolCallController) {
              toolCallController.setResponse({
                result: part.error as any,
                isError: true,
              });
            }
            break;
          }

          case 'start-step': {
            // Generate a message ID for the step
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            controller.enqueue({
              type: 'step-start',
              path: [],
              messageId,
            });
            break;
          }

          case 'finish-step': {
            const usage = part.usage as any;
            controller.enqueue({
              type: 'step-finish',
              path: [],
              finishReason: part.finishReason as any,
              usage: {
                promptTokens: usage.promptTokens ?? usage.prompt?.tokens ?? 0,
                completionTokens:
                  usage.completionTokens ?? usage.completion?.tokens ?? 0,
              },
              isContinued: false,
            });
            break;
          }

          case 'finish': {
            const usage = part.totalUsage as any;
            controller.enqueue({
              type: 'message-finish',
              path: [],
              finishReason: part.finishReason as any,
              usage: {
                promptTokens: usage.promptTokens ?? usage.prompt?.tokens ?? 0,
                completionTokens:
                  usage.completionTokens ?? usage.completion?.tokens ?? 0,
              },
            });
            break;
          }

          case 'error': {
            controller.enqueue({
              type: 'error',
              path: [],
              error:
                part.error instanceof Error
                  ? part.error.message
                  : typeof part.error === 'string'
                    ? part.error
                    : 'Unknown error',
            });
            break;
          }

          // Ignore other part types for now
          case 'start':
          case 'abort':
          case 'raw':
          case 'reasoning-start':
          case 'reasoning-delta':
          case 'reasoning-end':
          case 'source':
          case 'file':
            break;
        }
      }

      // Close any remaining controllers
      textController?.close();
      toolCallControllers.forEach(ctrl => ctrl.close());
      controller.close();
    } catch (error) {
      controller.enqueue({
        type: 'error',
        path: [],
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Unknown error',
      });
      controller.close();
    }
  })();

  // Create the DataStream encoder
  const encoder = new DataStreamEncoder();

  // Return the response using AssistantStream.toResponse
  return AssistantStream.toResponse(assistantStream, encoder);
}
