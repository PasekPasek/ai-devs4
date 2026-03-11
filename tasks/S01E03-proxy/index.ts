import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { SessionManager } from './session-manager';
import { runAgent } from './agent';
import { tools } from './tools';
import { ChatRequestSchema, ChatResponseSchema, type ChatRequest, type ChatResponse } from './types';

const fastify = Fastify({
  logger: false
});

const sessionManager = new SessionManager();

// Enable CORS
fastify.register(cors, {
  origin: '*'
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const stats = sessionManager.getStats();
  return {
    status: 'ok',
    uptime: process.uptime(),
    sessions: stats
  };
});

// Main chat endpoint
fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
  try {
    // Validate request body
    const { sessionID, msg } = ChatRequestSchema.parse(request.body);

    console.log(`\n[CHAT] Session: ${sessionID}, Message: ${msg}`);

    // Get or create session
    const session = sessionManager.getOrCreate(sessionID);

    // Add user message to conversation
    session.messages.push({
      role: 'user',
      content: msg
    });

    // Run agent loop
    const result = await runAgent(session.messages, tools);

    // Update session with new messages
    session.messages = result.messages;
    sessionManager.update(session);

    // Extract final assistant response
    const lastAssistantMessage = [...result.messages]
      .reverse()
      .find(m => m.role === 'assistant' && m.content);

    const responseMsg = lastAssistantMessage?.content || 'Przepraszam, coś poszło nie tak.';

    console.log(`[CHAT] Response: ${responseMsg}\n`);

    const response: ChatResponse = {
      msg: responseMsg
    };

    return ChatResponseSchema.parse(response);

  } catch (error) {
    console.error('[CHAT] Error:', error);

    // Return graceful error response
    const errorResponse: ChatResponse = {
      msg: 'Przepraszam, mam problem z systemem. Spróbuj ponownie za chwilę.'
    };

    reply.status(200); // Return 200 even on errors to maintain conversation flow
    return errorResponse;
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: config.SERVER_PORT,
      host: '0.0.0.0'
    });

    console.log(`
╔════════════════════════════════════════════════════════╗
║  S01E03 Proxy Server Running                          ║
╠════════════════════════════════════════════════════════╣
║  Port: ${config.SERVER_PORT}                                         ║
║  Model: ${config.MODEL_NAME}                      ║
║  Max Iterations: ${config.MAX_ITERATIONS}                             ║
╠════════════════════════════════════════════════════════╣
║  Endpoints:                                            ║
║    POST /chat    - Main chat interface                ║
║    GET  /health  - Health check                       ║
╚════════════════════════════════════════════════════════╝
    `);

    console.log('Ready to intercept operator communications...\n');

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
