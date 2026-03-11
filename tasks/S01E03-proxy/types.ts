import { z } from 'zod';

export const ChatRequestSchema = z.object({
  sessionID: z.string().min(1),
  msg: z.string().min(1)
});

export const ChatResponseSchema = z.object({
  msg: z.string()
});

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.any()).optional()
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export interface Session {
  sessionID: string;
  messages: Message[];
  createdAt: number;
  lastAccessedAt: number;
  metadata: {
    securityCode?: string;
    reactorPackageId?: string;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}
