# API examples

The Sanity CLI can create, build and refresh a Knowledge Base. It can't read entries, list issues or resolve them. `@sanity/client` can, through `client.context`. These methods are not in Sanity's public docs, so treat them as likely to change. Every call below was run against a real Knowledge Base on 2026-09-17.

Write a short throwaway script from these examples, save it in the user's Sanity project folder, run it with `node`, and delete it. Don't add it to the repo.

## Get a client

This borrows the project's Sanity CLI, so it uses the `npx sanity login` session and needs no token.

```js
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const KB_ID = 'kb...'
const API_VERSION = 'v2026-08-25'

const fromProject = createRequire(join(process.cwd(), 'package.json'))
let cliCore
for (const pkg of ['@sanity/cli/package.json', 'sanity/package.json']) {
  try {
    const fromCli = createRequire(fromProject.resolve(pkg))
    cliCore = await import(pathToFileURL(fromCli.resolve('@sanity/cli-core')).href)
    break
  } catch {}
}
const { getGlobalCliClient, getProjectCliClient } = cliCore

const kb = await (await getGlobalCliClient({ apiVersion: API_VERSION, requireUser: true }))
  .context.knowledgeBases.get(KB_ID)

const client = await getGlobalCliClient({
  apiVersion: API_VERSION,
  requireUser: true,
  resource: { id: kb.publicId, type: 'knowledge-base' },
  context: { organizationId: kb.organizationId },
})
```

Don't end the script with `process.exit()` after network calls. On Windows that can crash Node while sockets close. Set `process.exitCode` and let it finish.

## Read the entries

```js
const outline = await client.context.entries.list()
// [{ _id, path, title, tldr, status }], status is 'filled' once written

const entry = await client.context.entries.get({ path: 'delivery' })
// entry.body is Markdown, entry.citations lists its sources
```

This works before any MCP endpoint exists.

## List issues

`scripts/kb-issues.mjs <kb-id> --status open` does this and formats the result. The call underneath is:

```js
const issues = await client.context.issues.list({ status: 'open' }) // 'open' | 'accepted' | 'rejected'
// issue._id, issue.status, and issue.content with:
// kind ('conflict' | 'update_required' | 'gap'), severity, claimKey,
// currentClaim, alternativeClaim, involvedScopes, scopePath, issue, suggestedFix
```

`accepted` means resolved. `rejected` means dismissed.

## Resolve, dismiss, reopen

```js
const issue = await client.context.issues.get({ issueId })
if (issue.content.kind !== 'conflict') throw new Error('only conflicts can be resolved')

// Print the winner and compare it with the user's pick before the call.
await client.context.issues.resolve({ issueId, resolution: 'keep_existing' }) // currentClaim wins, pick A
await client.context.issues.resolve({ issueId, resolution: 'accept_new' })    // alternativeClaim wins, pick B

await client.context.issues.dismiss({ issueId }) // close a stale issue, a suggestion or a gap
await client.context.issues.reopen({ issueId })  // undo a resolve, deletes the instruction it created
```

Resolving creates a standing instruction, the same as the dashboard's Resolve button. Read the issue back afterwards and confirm its `status` is `accepted`.

## Edit content with a revision guard

Use this only when no better write path exists, such as a Sanity MCP server the agent already has, or the user editing in Studio.

```js
const data = await getProjectCliClient({
  apiVersion: 'v2025-08-15',
  projectId: '<project-id>',
  dataset: '<dataset>',
  requireUser: true,
  useCdn: false,
  perspective: 'raw', // so drafts.<id> is visible
})

const doc = await data.getDocument('faq-main') // note doc._rev and the field's current value
const draft = await data.getDocument('drafts.faq-main') // someone's unpublished edits, if not null

await data
  .transaction()
  .patch('faq-main', (p) =>
    p.ifRevisionId(doc._rev).set({ 'items[_key=="ret"].answer': 'You have 14 days from delivery...' }),
  )
  .commit({ dryRun: true }) // drop dryRun once the user has approved the change
```

- `ifRevisionId` makes the commit fail with a 409 if anyone edited the document after you read it. Nothing is written in that case. Read it again and show the user the new value.
- `commit({ dryRun: true })` validates the whole transaction without writing.
- Address array items by `_key`, never by index.
- To write a draft instead of publishing, create `drafts.<id>` from the published document with `transaction.create(...)`, then patch that. If a draft already exists, patch it with its own `_rev`, and tell the user the draft holds other unpublished edits.
- Patching only the published document while a draft exists leaves the old claim in the draft. Publishing that draft later brings the claim back. Patch both, each with its own revision.
