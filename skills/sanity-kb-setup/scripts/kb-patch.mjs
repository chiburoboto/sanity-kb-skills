#!/usr/bin/env node
/**
 * Correct fields in Sanity documents from a patches file.
 *
 *   node kb-patch.mjs <project-id> <dataset> <patches.json> [--publish] [--dry-run]
 *
 * patches.json is an array. Paths use Sanity's patch syntax, and array items
 * are addressed by _key:
 *
 *   [
 *     { "id": "faq-main", "set": { "items[_key==\"ret\"].answer": "14 days..." } },
 *     { "id": "product-dripper", "set": { "dishwasherSafe": false }, "unset": ["oldField"] }
 *   ]
 *
 * By default it writes DRAFTS, so a person reviews and publishes in Studio.
 * With --publish it patches the published documents directly. Knowledge Bases
 * only read published documents, so refresh after the edits are published.
 *
 * Only run this once a person has agreed to the change list. Run it from a
 * Sanity project folder. It borrows the project's Sanity CLI and its login.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const API_VERSION = 'v2025-08-15'

const args = process.argv.slice(2)
const publish = args.includes('--publish')
const dryRun = args.includes('--dry-run')
const [projectId, dataset, file] = args.filter((arg) => !arg.startsWith('--'))

if (!projectId || !dataset || !file) {
  console.error('Usage: node kb-patch.mjs <project-id> <dataset> <patches.json> [--publish] [--dry-run]')
  process.exit(1)
}

let patches
try {
  patches = JSON.parse(await readFile(file, 'utf8'))
  if (!Array.isArray(patches) || !patches.length) throw new Error('expected a non-empty array')
  for (const patch of patches) {
    if (!patch.id || (!patch.set && !patch.unset)) throw new Error('each patch needs "id" and "set" or "unset"')
    if (patch.id.startsWith('drafts.')) throw new Error(`use the published id, not "${patch.id}"`)
  }
} catch (error) {
  console.error(`Could not read ${file}: ${error.message}`)
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

const { getProjectCliClient } = await loadCliCore()
const client = await getProjectCliClient({
  apiVersion: API_VERSION,
  projectId,
  dataset,
  requireUser: true,
  useCdn: false,
  perspective: 'raw',
})

const ids = patches.flatMap((patch) => [patch.id, `drafts.${patch.id}`])
const existing = await client.fetch('*[_id in $ids]', { ids })
const byId = new Map(existing.map((doc) => [doc._id, doc]))

console.log(`${projectId}/${dataset}: ${patches.length} document(s), ${publish ? 'PUBLISHED directly' : 'as drafts'}${dryRun ? ', dry run' : ''}.\n`)

const transaction = client.transaction()
for (const patch of patches) {
  const published = byId.get(patch.id)
  const draft = byId.get(`drafts.${patch.id}`)
  if (!published && !draft) {
    console.error(`No document "${patch.id}". Nothing was changed.`)
    process.exit(1)
  }

  let targetId = patch.id
  if (!publish) {
    targetId = `drafts.${patch.id}`
    if (!draft) {
      const { _rev, _updatedAt, _createdAt, ...rest } = published
      transaction.createIfNotExists({ ...rest, _id: targetId })
    }
  } else if (!published) {
    console.error(`"${patch.id}" has never been published, so --publish can't patch it. Drop --publish to edit its draft.`)
    process.exit(1)
  } else if (draft) {
    console.log(`Note: "${patch.id}" also has a draft. It still holds the old values, and publishing it later would undo this fix.`)
  }

  console.log(`${targetId} (${(published ?? draft)._type})`)
  for (const [path, value] of Object.entries(patch.set ?? {})) console.log(`   set   ${path} = ${JSON.stringify(value)}`)
  for (const path of patch.unset ?? []) console.log(`   unset ${path}`)

  transaction.patch(targetId, (p) => {
    let next = p
    if (patch.set) next = next.set(patch.set)
    if (patch.unset?.length) next = next.unset(patch.unset)
    return next
  })
}

if (dryRun) {
  // No process.exit here. On Windows it can crash Node while the client's sockets close.
  console.log('\nDry run. Nothing changed.')
} else {
  try {
    const result = await transaction.commit()
    console.log(`\nDone. Transaction ${result.transactionId}.`)
    console.log(
      publish
        ? 'Next: npx sanity context refresh <kb-id>, wait for the job, then npx sanity context build <kb-id> --watch.'
        : 'Next: review and publish the drafts in Studio. Then refresh and rebuild the Knowledge Base.',
    )
  } catch (error) {
    console.error(`\nFailed: ${error.message}`)
    console.error('A 401 or 403 means the logged-in user needs Editor or higher on this project.')
    process.exitCode = 1
  }
}
