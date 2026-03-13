import { config } from './config.js';
import { executeToolCall } from './tool-handlers.js';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callOpenRouter(
  messages: Message[],
  tools: any[]
): Promise<{
  message: Message;
  finish_reason: string;
  tool_calls?: ToolCall[];
}> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openRouterToken}`,
      'HTTP-Referer': 'https://github.com/ppasek/ai-devs4',
      'X-Title': 'AI_DEVS4 - Railway Agent'
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      tools,
      tool_choice: 'auto'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as ChatResponse;
  const choice = data.choices[0];

  console.log(`[LLM] ${config.model} → finish_reason: ${choice.finish_reason}`);

  if (data.usage) {
    console.log(
      `[LLM] Tokens: prompt=${data.usage.prompt_tokens}, completion=${data.usage.completion_tokens}, total=${data.usage.total_tokens}`
    );
  }

  return {
    message: {
      role: 'assistant',
      content: choice.message.content || '',
      tool_calls: choice.message.tool_calls
    },
    finish_reason: choice.finish_reason,
    tool_calls: choice.message.tool_calls
  };
}

export async function runAgent(
  systemPrompt: string,
  tools: any[],
  maxIterations: number = 30
): Promise<any> {
  const messages: Message[] = [{ role: 'system', content: systemPrompt }];

  console.log('\n=== AGENT STARTED ===');
  console.log(`Model: ${config.model}`);
  console.log(`Max iterations: ${maxIterations}\n`);

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    console.log(`\n--- Iteration ${iteration + 1}/${maxIterations} ---`);

    const response = await callOpenRouter(messages, tools);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log('\n=== AGENT COMPLETED (no more tool calls) ===');
      return {
        completed: true,
        result: response.message.content,
        iterations: iteration + 1
      };
    }

    messages.push(response.message);

    for (const toolCall of response.tool_calls) {
      console.log(`\n[AGENT] Calling tool: ${toolCall.function.name}`);
      console.log(`[AGENT] Arguments: ${toolCall.function.arguments}`);

      const result = await executeToolCall(toolCall);

      console.log(`[AGENT] Result: ${result.substring(0, 500)}${result.length > 500 ? '...' : ''}`);

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });

      // Detect flag in response body
      if (result.includes('{FLG:')) {
        const match = result.match(/\{FLG:[^}]+\}/);
        if (match) {
          console.log(`\n=== FLAG FOUND: ${match[0]} ===`);
          return { completed: true, flag: match[0], result, iterations: iteration + 1 };
        }
      }
    }
  }

  throw new Error(`Agent exceeded maximum iterations (${maxIterations}).`);
}
