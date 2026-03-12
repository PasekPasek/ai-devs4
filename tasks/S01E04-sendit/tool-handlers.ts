import { config } from './config.js';

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Fetch a text document from a URL
 */
async function fetchDocument(url: string): Promise<string> {
  console.log(`[TOOL] fetch_document: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Fetch an image and analyze it using a vision model
 */
async function analyzeImage(url: string, question: string): Promise<string> {
  console.log(`[TOOL] analyze_image: ${url}`);
  console.log(`[TOOL] Question: ${question}`);

  // Fetch the image
  const imageResponse = await fetch(url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
  }
  const buffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = imageResponse.headers.get('content-type') || 'image/png';

  // Call vision model via OpenRouter
  const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openRouterToken}`,
      'HTTP-Referer': 'https://github.com/ppasek/ai-devs4',
      'X-Title': 'AI_DEVS4 - SentIt Agent'
    },
    body: JSON.stringify({
      model: config.visionModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` }
            },
            {
              type: 'text',
              text: question
            }
          ]
        }
      ]
    })
  });

  if (!visionResponse.ok) {
    const errorText = await visionResponse.text();
    throw new Error(`Vision API error: ${visionResponse.status} - ${errorText}`);
  }

  const data = await visionResponse.json() as any;
  return data.choices[0].message.content || 'No response from vision model';
}

/**
 * Submit the declaration to the hub for verification
 */
async function submitDeclaration(declaration: string): Promise<string> {
  console.log(`[TOOL] submit_declaration`);
  console.log(`[TOOL] Declaration:\n${declaration}`);

  const response = await fetch(config.verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: config.hubToken,
      task: 'sendit',
      answer: { declaration }
    })
  });

  const result = await response.json() as any;
  console.log(`[TOOL] Submit result:`, result);
  return JSON.stringify(result);
}

/**
 * Execute a tool call and return the result as a string
 */
export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const args = JSON.parse(toolCall.function.arguments);

  try {
    switch (toolCall.function.name) {
      case 'fetch_document':
        return await fetchDocument(args.url);

      case 'analyze_image':
        return await analyzeImage(args.url, args.question);

      case 'submit_declaration':
        return await submitDeclaration(args.declaration);

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[TOOL] Error in ${toolCall.function.name}: ${message}`);
    return JSON.stringify({ error: message });
  }
}
