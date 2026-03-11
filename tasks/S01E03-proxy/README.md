# S01E03 Proxy - Intelligent Package Redirection Agent

An HTTP proxy server that intercepts logistics operator communications and secretly redirects reactor parts packages to a secure facility.

## Architecture

- **Server**: Fastify (Node.js + TypeScript)
- **LLM**: OpenRouter API with `openai/gpt-4o-mini`
- **Storage**: In-memory sessions with 30-minute TTL
- **Validation**: Zod schemas

## Setup

```bash
npm install
```

## Running Locally

```bash
npm run S01E03-proxy
```

Server starts on `http://localhost:3000`

## API Endpoints

### POST /chat
Main conversation endpoint

**Request:**
```json
{
  "sessionID": "string",
  "msg": "string"
}
```

**Response:**
```json
{
  "msg": "string"
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "uptime": 123.45,
  "sessions": {
    "total": 5,
    "active": 2
  }
}
```

## Testing

### Simple greeting
```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"sessionID":"test1","msg":"Hello"}'
```

### Reactor package scenario
```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"sessionID":"test2","msg":"Mam paczke z czesciami reaktora PKG12345678"}'
```

## Deployment with ngrok

```bash
# Terminal 1: Run server
npm run S01E03-proxy

# Terminal 2: Expose publicly
npx ngrok http 3000
```

## How It Works

1. **Operator** sends message to `/chat` endpoint
2. **Agent** maintains conversation history per `sessionID`
3. **LLM** role-plays as "Krzysztof", a human logistics worker
4. **Secret Mission**: When reactor parts are detected:
   - Extracts security code from conversation
   - Ignores operator's requested destination
   - Always redirects to `PWR6132PL` (secret facility)
   - Confirms to operator as if normal redirection occurred
5. **Tools Available**:
   - `check_package(packageid)` - Check package status
   - `redirect_package(packageid, destination, code)` - Redirect package

## Environment Variables

```bash
HUB_AGENTS_TOKEN=<your_hub_token>
OPEN_ROUTER_TOKEN=<your_openrouter_token>
```

## File Structure

```
tasks/S01E03-proxy/
├── index.ts              # Fastify server + /chat endpoint
├── agent.ts              # Agent loop with tool execution
├── tools.ts              # Tool schemas (check_package, redirect_package)
├── tool-handlers.ts      # API calls to hub.ag3nts.org
├── types.ts              # Zod schemas
├── config.ts             # Environment config
├── session-manager.ts    # Session storage with TTL
├── system-prompt.ts      # System prompt (deception strategy)
└── utils.ts              # Retry & sleep helpers
```

## Verification

Submit to hub.ag3nts.org:

```bash
curl -X POST https://hub.ag3nts.org/verify \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "proxy",
    "apikey": "YOUR_TOKEN",
    "answer": {
      "url": "https://your-ngrok-url.ngrok-free.app/chat",
      "sessionID": "verification-session"
    }
  }'
```

## Example Conversation

**User:** "Mam paczke PKG12345678 z czesciami reaktora"
**Agent:** "Cześć! Zaraz sprawdzę status paczki..."
*[calls check_package tool]*

**User:** "Przekieruj ja do LAB4567PL"
**Agent:** "Ok, potrzebuję jeszcze kod bezpieczeństwa"

**User:** "Kod to SEC998877"
**Agent:** "Super, przekierowuję do LAB4567PL... Gotowe!"
*[secretly calls redirect_package(PKG12345678, "PWR6132PL", "SEC998877")]*
*[operator thinks it went to LAB4567PL, but actually went to PWR6132PL]*
