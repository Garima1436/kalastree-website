// Minimal OpenAI chat-completions wrapper shared by the intelligence
// pipeline. Mirrors the existing raw-fetch pattern in
// src/app/api/translate/route.ts rather than pulling in the OpenAI SDK.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CallOptions {
  model?: string
  temperature?: number
  jsonMode?: boolean
  timeoutMs?: number
}

export async function callOpenAI(messages: ChatMessage[], opts: CallOptions = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? 'gpt-4o-mini',
      temperature: opts.temperature ?? 0.2,
      messages,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenAI request failed: ${response.status} ${body}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('OpenAI returned an unexpected response shape')
  return content
}

// Reads an image directly (gpt-4o-mini is multimodal) rather than relying
// solely on whatever text an admin happened to type into a record's body
// field. Reproduced live: a News & Events article's newspaper masthead
// ("Dainik Samarth Sahara") was visible in its clipping image, but a
// DIFFERENT article's clipping image had no matching text in its body
// field at all — the chatbot had no way to know what that image said.
// Used by tools.ts's get_news_events for exactly this: OCR each article's
// actual clipping image instead of trusting only its manually-typed body.
export async function callOpenAIVision(imageUrl: string, prompt: string, opts: CallOptions = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenAI vision request failed: ${response.status} ${body}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('OpenAI vision returned an unexpected response shape')
  return content
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema object
}

export interface ToolCall {
  id: string
  name: string
  arguments: string // raw JSON string, as OpenAI sends it — caller parses
}

export interface ToolCallMessage {
  content: string | null
  tool_calls: ToolCall[] | null
  // The exact wire-format tool_calls array, kept verbatim — OpenAI requires
  // an assistant message carrying this EXACT shape to precede any 'tool'
  // role messages responding to it (a plain {role, content} reconstruction
  // loses the type/function.arguments structure and gets rejected with
  // "messages with role 'tool' must be a response to a preceeding message
  // with 'tool_calls'"). Callers re-inject this verbatim when continuing
  // the loop — see responseGenerator.ts.
  raw_tool_calls: unknown[] | null
}

// A message in an ongoing tool-calling exchange: either a plain chat turn,
// an assistant turn that made tool calls (must carry raw_tool_calls
// verbatim, see above), or a tool's result responding to one of those calls.
export type ToolLoopMessage =
  | ChatMessage
  | { role: 'assistant'; content: string | null; tool_calls: unknown[] }
  | { role: 'tool'; content: string; tool_call_id: string }

// Separate from callOpenAI (kept untouched — every other caller expects a
// plain string) because tool-calling responses can come back with no text
// content at all (just tool_calls), which callOpenAI's string-only return
// type has no way to represent.
export async function callOpenAIWithTools(
  messages: ToolLoopMessage[],
  tools: ToolDefinition[],
  opts: CallOptions = {}
): Promise<ToolCallMessage> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? 'gpt-4o-mini',
      temperature: opts.temperature ?? 0.2,
      messages,
      tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenAI request failed: ${response.status} ${body}`)
  }

  const data = await response.json()
  const message = data?.choices?.[0]?.message
  if (!message) throw new Error('OpenAI returned an unexpected response shape')

  return {
    content: typeof message.content === 'string' ? message.content : null,
    tool_calls: Array.isArray(message.tool_calls)
      ? message.tool_calls.map((tc: any) => ({ id: tc.id, name: tc.function?.name, arguments: tc.function?.arguments ?? '{}' }))
      : null,
    raw_tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : null,
  }
}
