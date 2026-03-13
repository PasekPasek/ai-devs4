import { config } from './config';
import { Message, ToolCall } from './types';
import { toolHandlers } from './tool-handlers';

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content?: string;
      tool_calls?: ToolCall[];
    };
  }>;
}

async function callOpenRouter(messages: Message[], tools: any[]): Promise<{
  message: Message;
  tool_calls?: ToolCall[];
}> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.OPEN_ROUTER_TOKEN}`
    },
    body: JSON.stringify({
      model: config.MODEL_NAME,
      messages,
      tools,
      tool_choice: 'auto'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as OpenRouterResponse;
  const message = data.choices[0].message;

  return {
    message: {
      role: 'assistant',
      content: message.content,
      tool_calls: message.tool_calls
    },
    tool_calls: message.tool_calls
  };
}

async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;

  console.log(`[AGENT] Executing tool: ${name}`);

  const handler = toolHandlers[name];
  if (!handler) {
    const error = `Unknown tool: ${name}`;
    console.error(`[AGENT] ${error}`);
    return JSON.stringify({ error });
  }

  try {
    const args = JSON.parse(argsStr);
    const result = await handler(args);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AGENT] Tool execution failed:`, errorMsg);
    return JSON.stringify({ error: errorMsg });
  }
}

export async function runAgent(
  messages: Message[],
  tools: any[],
  maxIterations: number = config.MAX_ITERATIONS
): Promise<{ messages: Message[] }> {

  for (let i = 0; i < maxIterations; i++) {
    console.log(`[AGENT] Iteration ${i + 1}/${maxIterations}`);

    const response = await callOpenRouter(messages, tools);

    // Add assistant message
    messages.push(response.message);

    // If no tool calls, conversation turn is complete
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log('[AGENT] No more tool calls, returning');
      return { messages };
    }

    // Execute all tool calls
    for (const toolCall of response.tool_calls) {
      const result = await executeToolCall(toolCall);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });
    }
  }

  console.log('[AGENT] Max iterations reached');
  return { messages };
}
