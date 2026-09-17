#!/usr/bin/env node
/**
 * Test a Sanity Context MCP endpoint before configuring any agent.
 *
 *   node kb-mcp-check.mjs [--read <entry-path>]
 *
 * Reads two environment variables, or the same names from .env.local in the
 * current folder:
 *   SANITY_CONTEXT_MCP_URL=https://api.sanity.io/v1/context/organizations/<org>/mcp/<endpoint>
 *   SANITY_ORGANIZATION_TOKEN=<organisation token with Context Viewer>
 *
 * It speaks MCP over HTTP directly, so it has no dependencies. It lists the
 * tools and prints the outline from initial_context. Two tools means Knowledge
 * Base mode. Four means GROQ mode: a dataset source is attached to the endpoint
 * and the Knowledge Bases are ignored. With --read it also prints one entry,
 * for example --read delivery. Read-only. It never prints the token.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const raw = await readFile(join(process.cwd(), '.env.local'), 'utf8').catch(() => '')
for (const line of raw.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
}

const url = process.env.SANITY_CONTEXT_MCP_URL
const token = process.env.SANITY_ORGANIZATION_TOKEN
const readIndex = process.argv.indexOf('--read')
const entryPath = readIndex === -1 ? null : process.argv[readIndex + 1]

if (!url || !token) {
  console.error('Set SANITY_CONTEXT_MCP_URL and SANITY_ORGANIZATION_TOKEN, in the environment or in .env.local.')
  console.error('The token is an ORGANISATION token with Context Viewer, from sanity.io/manage > organisation > API > Tokens.')
  process.exit(1)
}

let sessionId = null
let nextId = 1

async function rpc(method, params) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${token}`,
  }
  if (sessionId) headers['mcp-session-id'] = sessionId

  const body = { jsonrpc: '2.0', method, ...(params ? { params } : {}) }
  const isNotification = method.startsWith('notifications/')
  if (!isNotification) body.id = nextId++

  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  const session = response.headers.get('mcp-session-id')
  if (session) sessionId = session

  if (!response.ok) {
    const error = new Error(`${method} failed: ${response.status} ${(await response.text()).slice(0, 300)}`)
    error.status = response.status
    throw error
  }
  if (isNotification || response.status === 202) return null

  const text = await response.text()
  // Streamable HTTP may answer as JSON or as a single SSE frame.
  const payload = text.startsWith('event:') || text.startsWith('data:')
    ? text
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('')
    : text

  const message = JSON.parse(payload)
  if (message.error) {
    const error = new Error(`${method}: ${message.error.message} (${message.error.code})`)
    error.code = message.error.code
    throw error
  }
  return message.result
}

const textOf = (result) =>
  (result?.content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')

try {
  const init = await rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'kb-mcp-check', version: '1.0.0' },
  })
  console.log('Connected to', init?.serverInfo?.name ?? 'the endpoint')
  await rpc('notifications/initialized')

  const { tools } = await rpc('tools/list')
  console.log(`\nTools (${tools.length}):`)
  for (const tool of tools) console.log(` - ${tool.name}`)

  const knowledgeBaseMode = tools.some((tool) => tool.name === 'knowledge_base_read')
  console.log(`\nMode: ${knowledgeBaseMode ? 'Knowledge Base' : 'GROQ'}`)
  if (!knowledgeBaseMode) {
    console.log('A dataset source is attached to this endpoint, so its Knowledge Bases are ignored.')
    console.log('Remove the dataset source, or create an endpoint with the Knowledge Base only.')
    process.exit(0)
  }

  const outline = textOf(await rpc('tools/call', { name: 'initial_context', arguments: {} }))
  console.log('\nOutline:\n')
  console.log(outline.slice(0, 4000))
  if (outline.length > 4000) console.log(`\n... ${outline.length - 4000} more characters`)

  if (entryPath) {
    const knowledgeBase = outline.match(/Knowledge base id: `(kb[^`]+)`/)?.[1]
    if (!knowledgeBase) throw new Error('No Knowledge Base id in the outline, so --read has nothing to read.')
    const entry = await rpc('tools/call', {
      name: 'knowledge_base_read',
      arguments: { knowledgeBase, paths: [entryPath] },
    })
    console.log(`\nEntry "${entryPath}":\n`)
    console.log(textOf(entry))
  }
} catch (error) {
  console.error('\nFailed:', error.message)
  if (error.status === 401) console.error('401: the token is missing, expired or mistyped.')
  if (error.status === 403) console.error('403: use an ORGANISATION token with Context Viewer. Project tokens fail with contextGrantRequired.')
  if (error.status === 404) console.error('404: check the organisation id and the endpoint name in the URL.')
  if (error.code === -32005) console.error('-32005: the endpoint has no readable Knowledge Base. Attach one, or wait for the first build.')
  process.exit(1)
}
