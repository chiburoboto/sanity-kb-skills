#!/usr/bin/env node
/**
 * Resolve, dismiss or reopen one issue on a Sanity Context Knowledge Base.
 *
 *   node kb-resolve.mjs <knowledge-base-id> <issue-id> keep|accept|dismiss|reopen [--dry-run]
 *
 *   keep     The Knowledge Base's current claim wins ("KB says" in kb-issues.mjs).
 *   accept   The other source's claim wins ("Other" in kb-issues.mjs).
 *   dismiss  Close the issue without choosing. Use it for suggestions and gaps.
 *   reopen   Undo a resolve. Clears the resolution and deletes its instruction.
 *
 * keep and accept only work on conflict issues, and each mints a standing
 * instruction, the same as the dashboard's Resolve button. Only run this for a
 * choice a person has made.
 *
 * Run it from a Sanity project folder. Like kb-issues.mjs, it borrows the
 * project's Sanity CLI and its login. The issues API is not in Sanity's public
 * docs, so it may change.
 */
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const API_VERSION = 'v2026-08-25'
const ACTIONS = ['keep', 'accept', 'dismiss', 'reopen']

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const [knowledgeBaseId, issueId, action] = args.filter((arg) => !arg.startsWith('--'))

if (!knowledgeBaseId || !issueId || !ACTIONS.includes(action)) {
  console.error('Usage: node kb-resolve.mjs <knowledge-base-id> <issue-id> keep|accept|dismiss|reopen [--dry-run]')
  console.error('List issue ids with: node kb-issues.mjs <knowledge-base-id> --status open')
  process.exit(1)
}

async function loadCliCore() {
  const fromProject = createRequire(join(process.cwd(), 'package.json'))
  for (const entry of ['@sanity/cli/package.json', 'sanity/package.json']) {
    try {
      const fromCli = createRequire(fromProject.resolve(entry))
      return await import(pathToFileURL(fromCli.resolve('@sanity/cli-core')).href)
    } catch {
      // try the next entry
    }
  }
  console.error('Could not find the Sanity CLI in this folder. Run this from a project with `sanity` installed.')
  process.exit(1)
}

const { getGlobalCliClient } = await loadCliCore()

let knowledgeBase
try {
  const client = await getGlobalCliClient({ apiVersion: API_VERSION, requireUser: true })
  knowledgeBase = await client.context.knowledgeBases.get(knowledgeBaseId)
} catch (error) {
  console.error(`Could not read knowledge base "${knowledgeBaseId}": ${error.message}`)
  process.exit(1)
}

const client = await getGlobalCliClient({
  apiVersion: API_VERSION,
  requireUser: true,
  resource: { id: knowledgeBase.publicId, type: 'knowledge-base' },
  context: { organizationId: knowledgeBase.organizationId },
})

const issue = await client.context.issues.get({ issueId })
if (!issue) {
  console.error(`No issue "${issueId}" on ${knowledgeBase.title}.`)
  process.exit(1)
}

const content = issue.content ?? {}
if ((action === 'keep' || action === 'accept') && content.kind !== 'conflict') {
  console.error(`Issue is a ${content.kind}, not a conflict. Use dismiss, or apply it in the dashboard.`)
  process.exit(1)
}

const winner = action === 'keep' ? content.currentClaim : action === 'accept' ? content.alternativeClaim : null
console.log(`${knowledgeBase.title}: ${action} ${issueId}`)
if (content.claimKey) console.log(`Fact:   ${content.claimKey}`)
if (winner) console.log(`Winner: ${winner}`)

if (dryRun) {
  console.log('Dry run. Nothing changed.')
  process.exit(0)
}

if (action === 'keep' || action === 'accept') {
  await client.context.issues.resolve({
    issueId,
    resolution: action === 'keep' ? 'keep_existing' : 'accept_new',
  })
} else if (action === 'dismiss') {
  await client.context.issues.dismiss({ issueId })
} else {
  await client.context.issues.reopen({ issueId })
}

const after = await client.context.issues.get({ issueId })
console.log(`Done. Status: ${after?.status ?? 'unknown'}.`)
console.log('Next: correct the losing claim in its source document, publish, then run `npx sanity context refresh`.')
